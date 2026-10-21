import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats";
import type { StatsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getStats();
  const payload: StatsResponse = {
    analyses: stats.analyses,
    issuesFound: stats.issuesFound,
  };
  return NextResponse.json(payload);
}
