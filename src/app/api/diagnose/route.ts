import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { diagnoseWithGemini } from "@/lib/gemini";
import { demoResult } from "@/lib/demo";
import { recordDiagnosis } from "@/lib/stats";
import type { DiagnoseResponse, Lang } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!allowRequest(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { image?: string; mimeType?: string; symptoms?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const symptoms = (body.symptoms ?? "").toString().slice(0, 500).trim();
  const lang: Lang = body.lang === "en" ? "en" : "pt";

  if (!ALLOWED_MIME.includes(mimeType) || image.length < 100 || image.length > MAX_BYTES) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  let result;
  let demo = false;

  if (process.env.GEMINI_API_KEY) {
    try {
      result = await diagnoseWithGemini(image, mimeType, symptoms, lang);
    } catch {
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }
  } else {
    demo = true;
    result = demoResult(lang, symptoms);
  }

  try {
    await recordDiagnosis(result.issues.length);
  } catch {
    // stats are best-effort; never block a diagnosis on them
  }

  const payload: DiagnoseResponse = { result, demo };
  return NextResponse.json(payload);
}
