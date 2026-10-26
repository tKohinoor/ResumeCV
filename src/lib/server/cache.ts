import { createHash } from "crypto";

const TTL = 24 * 60 * 60 * 1000;
const MAX = 300;
const store = new Map<string, { value: unknown; exp: number }>();

export function cacheKey(...parts: string[]) {
  return createHash("sha256")
    .update([process.env.GEMINI_MODEL ?? "", ...parts].join("\u0000"))
    .digest("hex");
}

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.exp < Date.now()) { store.delete(key); return undefined; }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown) {
  if (store.size >= MAX) store.delete(store.keys().next().value as string);
  store.set(key, { value, exp: Date.now() + TTL });
}