import { createHash } from "crypto";
import { redis } from "./redis";

// Bump this whenever you change a prompt or schema, so old cached answers aren't served.
const CACHE_VERSION = "v1";
const TTL_SEC = 24 * 60 * 60;
const MAX = 300;
const mem = new Map<string, { value: unknown; exp: number }>();

export function cacheKey(...parts: string[]) {
  const h = createHash("sha256")
    .update([CACHE_VERSION, process.env.GEMINI_MODEL ?? "", ...parts].join("\u0000"))
    .digest("hex");
  return `cv:cache:${h}`;
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  if (redis) {
    try {
      return (await redis.get<T>(key)) ?? undefined;
    } catch {
      console.error("[cache] redis get failed, using memory");
    }
  }
  const hit = mem.get(key);
  if (!hit) return undefined;
  if (hit.exp < Date.now()) { mem.delete(key); return undefined; }
  return hit.value as T;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, value, { ex: TTL_SEC });
      return;
    } catch {
      console.error("[cache] redis set failed, using memory");
    }
  }
  if (mem.size >= MAX) mem.delete(mem.keys().next().value as string);
  mem.set(key, { value, exp: Date.now() + TTL_SEC * 1000 });
}