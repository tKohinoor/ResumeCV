"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import CategoryBar from "@/components/CategoryBar";
import KeywordChips from "@/components/KeywordChips";
import { scoreResume } from "@/lib/scoring";
import type { ScoreResult } from "@/lib/scoring/types";
import type { ParsedResume } from "@/lib/parse";

function verdict(n: number) {
  return n >= 85 ? "Excellent" : n >= 70 ? "Good" : n >= 55 ? "Needs work" : "Needs a rework";
}

export default function ResultsPage() {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("resumecv:pending");
      if (!raw) return setEmpty(true);
      const { parsed, jd } = JSON.parse(raw) as { parsed: ParsedResume; jd: string };
      setFileName(parsed.fileName);
      setResult(scoreResume(parsed, jd));
    } catch {
      setEmpty(true);
    }
  }, []);

  if (empty)
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-slate-600">No analysis found. Start a new one.</p>
        <Link href="/analyze" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">New analysis</Link>
      </div>
    );
  if (!result) return <p className="text-slate-500">Scoring...</p>;

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

      <div className="flex gap-3">
        <Link href="/analyze" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Analyze another</Link>
      </div>
    </div>
  );
}