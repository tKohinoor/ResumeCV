import type { JdData, ResumeAiData } from "./schemas";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function post<T>(url: string, body: unknown, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.error ?? "Request failed.");
    return json.data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") throw new ApiError(0, "The AI took too long to respond.");
    throw new ApiError(0, "Could not reach the server.");
  } finally {
    clearTimeout(timer);
  }
}

export const fetchJd = (jd: string) =>
  post<JdData>("/api/analyze-jd", { jd: jd.trim().slice(0, 8000) }, 60_000);

export const fetchResumeAi = (redactedText: string, bullets: string[], jd: JdData | null) =>
  post<ResumeAiData>(
    "/api/analyze-resume",
    { resumeText: redactedText.slice(0, 20000), bullets, jd },
    90_000
  );