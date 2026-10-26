import { NextResponse } from "next/server";
import { AiError } from "@/lib/ai/client";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const PER_IP = Number(process.env.RATE_LIMIT_PER_HOUR ?? 20);
const GLOBAL = Number(process.env.GLOBAL_DAILY_CAP ?? 300);

const hits = new Map<string, number[]>();
let day = { start: Date.now(), count: 0 };

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

// Returns an error response if the request must be refused, otherwise null.
export function checkLimits(req: Request): NextResponse | null {
  const now = Date.now();
  if (now - day.start > DAY) day = { start: now, count: 0 };
  if (day.count >= GLOBAL)
    return NextResponse.json({ error: "AI capacity for today is used up. Try again tomorrow." }, { status: 429 });

  if (hits.size > 5000) for (const [ip, ts] of hits) if (!ts.some((t) => now - t < HOUR)) hits.delete(ip);

  const ip = clientIp(req);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < HOUR);
  if (recent.length >= PER_IP)
    return NextResponse.json({ error: "Too many analyses this hour. Please try again later." }, { status: 429 });

  recent.push(now);
  hits.set(ip, recent);
  day.count++;
  return null;
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof AiError) {
    const status = e.kind === "rate_limit" ? 429 : e.kind === "config" ? 500 : 502;
    return NextResponse.json({ error: e.message, kind: e.kind }, { status });
  }
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}