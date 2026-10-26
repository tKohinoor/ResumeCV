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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 25000);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timed out")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

const isRateLimit = (msg: string) => /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
const isTransient = (msg: string) => /503|UNAVAILABLE|high demand|overloaded|500|INTERNAL|DEADLINE|timed out/i.test(msg);

async function callModel(model: string, system: string, prompt: string): Promise<string> {
  const res = await withTimeout(getClient().models.generateContent({
    model,
    contents: prompt,
    config: { systemInstruction: system, temperature: 0, responseMimeType: "application/json" },
  }), TIMEOUT_MS);
  return res.text ?? "";
}

export async function generateJson<T>(opts: { system: string; prompt: string; schema: ZodType<T>; model?: string }): Promise<T> {
  const models = [opts.model || modelName(), process.env.GEMINI_FALLBACK_MODEL].filter(Boolean) as string[];
  getClient(); // throws a clean config error if env is missing

  let text = "";
  let lastError: AiError | null = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        text = await callModel(model, opts.system, opts.prompt);
        lastError = null;
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[gemini] ${model} attempt ${attempt + 1}:`, msg.slice(0, 300)); // never logs resume content
        if (isRateLimit(msg)) { lastError = new AiError("rate_limit", "Gemini rate limit reached."); break; }
        lastError = new AiError("upstream", "The AI service is busy or returned an error.");
        if (!isTransient(msg)) break;
        if (attempt === 0) await sleep(1500);
      }
    }
    if (!lastError) break;
  }

  if (lastError) throw lastError;

  const result = opts.schema.safeParse(parseJson(text));
  if (!result.success) throw new AiError("invalid", "The AI returned an unexpected format.");
  return result.data;
}