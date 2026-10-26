"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import CategoryBar from "@/components/CategoryBar";
import KeywordChips from "@/components/KeywordChips";
import AiPanel, { type AiStatus } from "@/components/AiPanel";
import { scoreResume, withAi } from "@/lib/scoring";
import { redactLine } from "@/lib/parse/redact";
import { fetchJd, fetchResumeAi } from "@/lib/ai/api";
import { getEntry, saveEntry, type HistoryEntry } from "@/lib/history";
import type { JdData, ResumeAiData } from "@/lib/ai/schemas";
import type { ParsedResume } from "@/lib/parse";

type Input = { parsed: ParsedResume; jd: string };

function verdict(n: number) {
  return n >= 85 ? "Excellent" : n >= 70 ? "Good" : n >= 55 ? "Needs work" : "Needs a rework";
}

export default function ResultsPage() {
  const [input, setInput] = useState<Input | null>(null);
  const [saved, setSaved] = useState<HistoryEntry | null>(null);
  const [jdData, setJdData] = useState<JdData | null>(null);
  const [ai, setAi] = useState<ResumeAiData | null>(null);
  const [status, setStatus] = useState<AiStatus>("loading");
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);
  const started = useRef(false);
  const entryId = useRef("");

  const runAi = useCallback(async (inp: Input) => {
    setStatus("loading");
    setError("");

    // 1) Job description first, so the resume call can check fit against it.
    let jdForResume: JdData | null = null;
    const jd = inp.jd.trim();
    if (jd.split(/\s+/).filter(Boolean).length >= 30 && jd.length >= 150) {
      try {
        jdForResume = await fetchJd(jd);
        setJdData(jdForResume);
      } catch {
        // keep the heuristic keyword extraction
      }
    }

    // 2) Resume review. Only redacted text and redacted bullets leave the browser.
    try {
      const bullets = inp.parsed.bullets.slice(0, 60).map((b) => redactLine(b).slice(0, 600));
      setAi(await fetchResumeAi(inp.parsed.redactedText, bullets, jdForResume));
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI feedback is unavailable.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      // Reopening a saved analysis from History: no scoring, no AI calls.
      const viewId = sessionStorage.getItem("resumecv:view");
      if (viewId) {
        const entry = getEntry(viewId);
        if (entry) {
          setSaved(entry);
          setAi(entry.ai);
          setStatus("done");
          return;
        }
        sessionStorage.removeItem("resumecv:view");
      }

      const raw = sessionStorage.getItem("resumecv:pending");
      if (!raw) return setEmpty(true);
      const inp = JSON.parse(raw) as Input;
      entryId.current = crypto.randomUUID();
      setInput(inp);
      runAi(inp);
    } catch {
      setEmpty(true);
    }
  }, [runAi]);

  const result = useMemo(() => {
    if (saved) return saved.result;
    if (!input) return null;
    return withAi(scoreResume(input.parsed, input.jd, jdData), ai);
  }, [saved, input, jdData, ai]);

  // Save once the AI step has finished (or failed); retries update the same entry.
  useEffect(() => {
    if (saved || !input || !result || status === "loading" || !entryId.current) return;
    saveEntry({
      id: entryId.current,
      fileName: input.parsed.fileName,
      hasJd: result.hasJd,
      jdTitle: jdData?.title || undefined,
      result,
      ai: ai ? { ...ai, bullets: [] } : null, // never store resume text
    });
  }, [saved, input, result, status, ai, jdData]);

  if (empty)
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-slate-600">No analysis found. Start a new one.</p>
        <Link href="/analyze" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">New analysis</Link>
      </div>
    );
  if (!result) return <p className="text-slate-500">Scoring...</p>;

  const fileName = saved ? saved.fileName : input!.parsed.fileName;
  const note = saved
    ? `Saved analysis from ${new Date(saved.date).toLocaleString()}`
    : status === "loading" ? "Preliminary score (rule-based). Refining with AI..."
    : status === "error" ? "Rule-based score. AI feedback unavailable."
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Results</h1>
        <p className="text-sm text-slate-500">
          {fileName} · {result.hasJd ? "Tailored to your job description" : "General score (no job description)"}
        </p>
      </div>

      <section className="flex flex-col items-center gap-6 rounded-2xl border bg-white p-6 sm:flex-row">
        <ScoreRing score={result.total} size={180} />
        <div>
          <p className="text-2xl font-bold">{verdict(result.total)}</p>
          {note && <p className="mt-1 text-sm font-medium text-indigo-600">{note}</p>}
          <p className="mt-1 max-w-md text-sm text-slate-600">
            This score reflects resume form and keyword fit: structure, clarity, measurable impact and, with a job
            description, how well it matches. It isn't a judgement of you as a candidate.
          </p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-5 rounded-2xl border bg-white p-6">
          <h2 className="font-semibold">Score breakdown</h2>
          {result.categories.map((c) => <CategoryBar key={c.key} c={c} />)}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-3 font-semibold">Top fixes</h2>
            {result.fixes.length ? (
              <ol className="space-y-3 text-sm">
                {result.fixes.map((f, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{i + 1}</span>
                    <span>{f.text} <span className="text-slate-400">(+{f.points} pts)</span></span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-600">No major fixes found. Nice work.</p>
            )}
          </section>

          {result.keywords && (
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="mb-3 font-semibold">Keywords from the job description</h2>
              <KeywordChips matched={result.keywords.matched} missing={result.keywords.missing} />
            </section>
          )}
        </div>
      </div>

      {(saved ? saved.ai : true) && (
        <AiPanel
          status={status}
          ai={ai}
          bullets={saved ? [] : input!.parsed.bullets}
          error={error}
          onRetry={() => input && runAi(input)}
        />
      )}

      <div className="flex gap-3">
        <Link href="/analyze" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Analyze another</Link>
        <Link href="/history" className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">History</Link>
      </div>
    </div>
  );
}