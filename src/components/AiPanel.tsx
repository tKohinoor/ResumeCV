"use client";
import { RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import type { ResumeAiData } from "@/lib/ai/schemas";

export type AiStatus = "loading" | "done" | "error";

const ratingColor = (r: number) =>
  r >= 4 ? "bg-green-50 text-green-700" : r === 3 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-3/4 rounded bg-slate-100" />
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-2/3 rounded bg-slate-100" />
    </div>
  );
}

const card = "rounded-2xl border bg-white p-6";

export default function AiPanel({
  status, ai, bullets, error, onRetry,
}: {
  status: AiStatus;
  ai: ResumeAiData | null;
  bullets: string[];
  error: string;
  onRetry: () => void;
}) {
  if (status === "loading")
    return (
      <section className={card}>
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Sparkles size={18} className="text-indigo-600" /> AI feedback
        </h2>
        <p className="mb-4 text-sm text-slate-500">Reviewing your bullets. This takes a few seconds...</p>
        <Skeleton />
      </section>
    );

  if (status === "error" || !ai)
    return (
      <section className={card}>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <TriangleAlert size={18} className="text-amber-600" /> AI feedback unavailable
        </h2>
        <p className="text-sm text-slate-600">
          {error || "Something went wrong."} The score above uses rule-based checks only.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </section>
    );

  const weak = ai.bullets.filter((b) => b.rating <= 3 && bullets[b.n - 1]).sort((a, b) => a.rating - b.rating);

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Sparkles size={18} className="text-indigo-600" /> AI feedback
        </h2>
        <p className="text-sm text-slate-700">{ai.summary}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-green-700">Strengths</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              {ai.strengths.map((s) => <li key={s}>• {s}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-red-700">Gaps</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              {ai.gaps.map((g) => <li key={g}>• {g}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {ai.jdFit && (
        <section className={card}>
          <h2 className="mb-3 font-semibold">Fit for this job</h2>
          <p className="text-sm text-slate-700">{ai.jdFit.assessment}</p>
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-green-700">Shown in your experience</h3>
              <div className="flex flex-wrap gap-2">
                {ai.jdFit.demonstrated.length
                  ? ai.jdFit.demonstrated.map((s) => <span key={s} className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">{s}</span>)
                  : <span className="text-xs text-slate-500">None clearly shown.</span>}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-amber-700">Not clearly shown</h3>
              <div className="flex flex-wrap gap-2">
                {ai.jdFit.notDemonstrated.length
                  ? ai.jdFit.notDemonstrated.map((s) => <span key={s} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{s}</span>)
                  : <span className="text-xs text-slate-500">Everything required is shown.</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      {weak.length > 0 && (
        <section className={card}>
          <h2 className="font-semibold">Bullets to improve</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Rewrites reuse only your own facts. Replace anything in [brackets] with a real number, and only if it's true.
          </p>
          <div className="space-y-5">
            {weak.map((b) => (
              <div key={b.n} className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${ratingColor(b.rating)}`}>{b.rating}/5</span>
                  <p className="text-slate-800">{bullets[b.n - 1]}</p>
                </div>
                {b.issue && <p className="pl-12 text-slate-500">{b.issue}</p>}
                {b.rewrite && (
                  <p className="ml-12 rounded-lg bg-indigo-50 p-3 text-indigo-900">{b.rewrite}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}