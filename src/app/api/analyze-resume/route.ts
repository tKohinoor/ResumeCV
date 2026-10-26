import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJson } from "@/lib/ai/client";
import { RESUME_SYSTEM, resumePrompt } from "@/lib/ai/prompts";
import { JdSchema, ResumeAiSchema, type ResumeAiData } from "@/lib/ai/schemas";
import { cacheGet, cacheKey, cacheSet } from "@/lib/server/cache";
import { aiErrorResponse, checkLimits } from "@/lib/server/guard";


const Body = z.object({
  resumeText: z.string().min(200).max(20000),
  bullets: z.array(z.string().max(600)).max(60),
  jd: JdSchema.nullable().optional(),
});

const nums = (s: string) => s.match(/\d+(?:[.,]\d+)?/g) ?? [];

// Drop rewrites that contain numbers not present in the original bullet (invented metrics).
function sanitize(data: ResumeAiData, bullets: string[]): ResumeAiData {
  const seen = new Set<number>();
  const cleaned = data.bullets
    .filter((b) => b.n >= 1 && b.n <= bullets.length && !seen.has(b.n) && seen.add(b.n))
    .map((b) => {
      let rewrite = b.rewrite && b.rewrite.trim() ? b.rewrite : null;
      if (rewrite) {
        const original = new Set(nums(bullets[b.n - 1]));
        if (nums(rewrite).some((x) => !original.has(x))) rewrite = null;
      }
      return { ...b, rewrite };
    });
  return { ...data, bullets: cleaned, strengths: data.strengths.slice(0, 3), gaps: data.gaps.slice(0, 3) };
}

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid or oversized input." }, { status: 400 });
  const { resumeText, bullets, jd } = body.data;

  const key = cacheKey("resume", resumeText, JSON.stringify(bullets), JSON.stringify(jd ?? null));
  const hit = await cacheGet<ResumeAiData>(key);
  if (hit) return NextResponse.json({ data: hit, cached: true });

  const limited = await checkLimits(req);
  if (limited) return limited;

  try {
    const raw = await generateJson({
      system: RESUME_SYSTEM,
      prompt: resumePrompt(resumeText, bullets, jd ?? null),
      schema: ResumeAiSchema,
    });
    const data = sanitize(jd ? raw : { ...raw, jdFit: null }, bullets);
    await cacheSet(key, data);
    return NextResponse.json({ data, cached: false });
  } catch (e) {
    return aiErrorResponse(e);
  }
}