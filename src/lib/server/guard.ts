import { NextResponse } from "next/server";
import { AiError } from "@/lib/ai/client";
import { redis } from "./redis";

const HOUR = 3600;
const DAY = 86400;
const PER_IP = Number(process.env.RATE_LIMIT_PER_HOUR ?? 20);
const GLOBAL = Number(process.env.GLOBAL_DAILY_CAP ?? 300);
const MAX_BODY_BYTES = 120_000;

type Hit = "ip" | "global" | null;

// ---- in-memory fallback (local dev, or Redis outage) ----
const hits = new Map<string, number[]>();
let day = { start: Date.now(), count: 0 };

function memoryCheck(ip: string): Hit {
  const now = Date.now();
  if (now - day.start > DAY * 1000) day = { start: now, count: 0 };
  if (day.count >= GLOBAL) return "global";
  if (hits.size > 5000) for (const [k, ts] of hits) if (!ts.some((t) => now - t < HOUR * 1000)) hits.delete(k);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < HOUR * 1000);
  if (recent.length >= PER_IP) return "ip";
  recent.push(now);
  hits.set(ip, recent);
  day.count++;
  return null;
}

// ---- Redis: fixed-window counters ----
async function redisCheck(ip: string): Promise<Hit> {
  const now = Math.floor(Date.now() / 1000);
  const ipKey = `cv:rl:ip:${ip}:${Math.floor(now / HOUR)}`;
  const dayKey = `cv:rl:day:${Math.floor(now / DAY)}`;

  const [ipCount] = await redis!.pipeline().incr(ipKey).expire(ipKey, HOUR * 2).exec<[number, number]>();
  if (ipCount > PER_IP) return "ip";

  const [dayCount] = await redis!.pipeline().incr(dayKey).expire(dayKey, DAY * 2).exec<[number, number]>();
  if (dayCount > GLOBAL) return "global";
  return null;
}

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function bodyTooLarge(req: Request): NextResponse | null {
  const len = Number(req.headers.get("content-length") ?? 0);
  return len > MAX_BODY_BYTES
    ? NextResponse.json({ error: "Request is too large." }, { status: 413 })
    : null;
}

// Returns an error response if the request must be refused, otherwise null.
export async function checkLimits(req: Request): Promise<NextResponse | null> {
  const ip = clientIp(req);
  let hit: Hit;
  try {
    hit = redis ? await redisCheck(ip) : memoryCheck(ip);
  } catch {
    console.error("[limits] redis failed, using memory");
    hit = memoryCheck(ip);
  }
  if (hit === "global")
    return NextResponse.json({ error: "AI capacity for today is used up. Try again tomorrow." }, { status: 429 });
  if (hit === "ip")
    return NextResponse.json({ error: "Too many analyses this hour. Please try again later." }, { status: 429 });
  return null;
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof AiError) {
    const status = e.kind === "rate_limit" ? 429 : e.kind === "config" ? 500 : 502;
    return NextResponse.json({ error: e.message, kind: e.kind }, { status });
  }
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}