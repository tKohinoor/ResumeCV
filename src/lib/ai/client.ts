import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

export class AiError extends Error {
  constructor(public kind: "config" | "rate_limit" | "invalid" | "upstream", message: string) {
    super(message);
  }
}

let client: GoogleGenAI | null = null;

export function modelName() {
  return process.env.GEMINI_MODEL ?? "";
}

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !modelName()) throw new AiError("config", "GEMINI_API_KEY or GEMINI_MODEL is missing in .env.local.");
  return (client ??= new GoogleGenAI({ apiKey: key }));
}

function parseJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export async function generateJson<T>(opts: { system: string; prompt: string; schema: ZodType<T> }): Promise<T> {
  let text = "";
  try {
    const res = await getClient().models.generateContent({
      model: modelName(),
      contents: opts.prompt,
      config: { systemInstruction: opts.system, temperature: 0, responseMimeType: "application/json" },
    });
    text = res.text ?? "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (e instanceof AiError) throw e;
    if (/429|RESOURCE_EXHAUSTED|quota|rate/i.test(msg)) throw new AiError("rate_limit", "Gemini rate limit reached.");
    console.error("[gemini]", msg); // server log only; never logs resume content
    throw new AiError("upstream", "The AI service returned an error.");
  }

  const result = opts.schema.safeParse(parseJson(text));
  if (!result.success) throw new AiError("invalid", "The AI returned an unexpected format.");
  return result.data;
}