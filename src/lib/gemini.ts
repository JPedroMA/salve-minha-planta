import type { DiagnosisResult, Lang, Severity, HealthStatus, Issue } from "./types";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are an expert botanist and plant pathologist analyzing a houseplant photo.
Diagnose the plant and respond ONLY with valid JSON matching the schema.
Rules:
- Write ALL text fields (plant_name, summary, issues, care) in the language given in lang ("pt" = Brazilian Portuguese, "en" = English), friendly and jargon-free, as if explaining to a concerned plant owner.
- plant_name: common name in the chosen language. scientific_name: Latin name.
- confidence: 0-100.
- health_status: "healthy" | "attention" | "critical".
- issues: 0-4 items. Each has title (short), severity ("low"|"medium"|"high"), cause (1-2 sentences why it happens), solution (1-3 actionable steps in plain language).
- care: water, light, soil, tip — each 1 sentence, specific to this species.
- If the photo is not a plant, set plant_name to "" and include one issue titled appropriately (e.g. "Não é uma planta" / "Not a plant") with severity "low".`;

const responseSchema = {
  type: "object",
  properties: {
    plant_name: { type: "string" },
    scientific_name: { type: "string" },
    confidence: { type: "integer" },
    health_status: { type: "string", enum: ["healthy", "attention", "critical"] },
    summary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          cause: { type: "string" },
          solution: { type: "string" },
        },
        required: ["title", "severity", "cause", "solution"],
      },
    },
    care: {
      type: "object",
      properties: {
        water: { type: "string" },
        light: { type: "string" },
        soil: { type: "string" },
        tip: { type: "string" },
      },
      required: ["water", "light", "soil", "tip"],
    },
  },
  required: ["plant_name", "scientific_name", "confidence", "health_status", "summary", "issues", "care"],
};

export class GeminiError extends Error {}

function parseResult(text: string): DiagnosisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("Invalid model response");
  }
  const r = parsed as Record<string, unknown>;
  const care = (r.care ?? {}) as Record<string, unknown>;
  const result: DiagnosisResult = {
    plant_name: String(r.plant_name ?? ""),
    scientific_name: String(r.scientific_name ?? ""),
    confidence: Math.max(0, Math.min(100, Number(r.confidence) || 0)),
    health_status: (["healthy", "attention", "critical"].includes(String(r.health_status))
      ? r.health_status
      : "attention") as HealthStatus,
    summary: String(r.summary ?? ""),
    issues: Array.isArray(r.issues)
      ? r.issues.slice(0, 4).map((raw) => {
          const i = raw as Record<string, unknown>;
          return {
            title: String(i.title ?? ""),
            severity: (["low", "medium", "high"].includes(String(i.severity))
              ? i.severity
              : "medium") as Severity,
            cause: String(i.cause ?? ""),
            solution: String(i.solution ?? ""),
          } satisfies Issue;
        })
      : [],
    care: {
      water: String(care.water ?? ""),
      light: String(care.light ?? ""),
      soil: String(care.soil ?? ""),
      tip: String(care.tip ?? ""),
    },
  };
  return result;
}

export async function diagnoseWithGemini(
  imageBase64: string,
  mimeType: string,
  symptoms: string,
  lang: Lang,
): Promise<DiagnosisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("missing key");

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Language: ${lang === "pt" ? "pt (Brazilian Portuguese)" : "en"}.${
              symptoms ? ` Owner's observations: ${symptoms}` : ""
            } Diagnose this plant.`,
          },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      response_mime_type: "application/json",
      response_schema: responseSchema,
    },
  };

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new GeminiError("network error");
  }

  if (!res.ok) {
    throw new GeminiError(`api error ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError("empty response");

  return parseResult(text);
}
