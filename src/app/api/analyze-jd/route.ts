import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJson } from "@/lib/ai/client";
import { JD_SYSTEM, jdPrompt } from "@/lib/ai/prompts";
import { JdSchema, type JdData } from "@/lib/ai/schemas";
import { cacheGet, cacheKey, cacheSet } from "@/lib/server/cache";
import { aiErrorResponse, bodyTooLarge, checkLimits } from "@/lib/server/guard";


const Body = z.object({ jd: z.string().min(150).max(8000) });

export async function POST(req: Request) {
  const big = bodyTooLarge(req);
  if (big) return big;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Job description is missing or too long." }, { status: 400 });

  const key = cacheKey("jd", body.data.jd);
  const hit = await cacheGet<JdData>(key);
  if (hit) return NextResponse.json({ data: hit, cached: true });

  const limited = checkLimits(req);
  if (limited) return limited;

  try {
    const data = await generateJson({ system: JD_SYSTEM, prompt: jdPrompt(body.data.jd), schema: JdSchema });
    await cacheSet(key, data);
    return NextResponse.json({ data, cached: false });
  } catch (e) {
    return aiErrorResponse(e);
  }
}