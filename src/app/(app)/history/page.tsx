"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { clearHistory, deleteEntry, loadHistory, type HistoryEntry } from "@/lib/history";

const tone = (n: number) =>
  n >= 80 ? "bg-green-50 text-green-700" : n >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

function Sparkline({ values }: { values: number[] }) {
  const w = 240, h = 56, pad = 6;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
    const y = h - pad - (Math.max(0, Math.min(100, v)) / 100) * (h - pad * 2);
    return [x, y] as const;
  });
  return (
    <svg width={w} height={h} role="img" aria-label="Score trend">
      <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={pts.map((p) => p.join(",")).join(" ")} />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#4f46e5" />)}
    </svg>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => setEntries(loadHistory()), []);

  function open(id: string) {
    sessionStorage.setItem("resumecv:view", id);
    router.push("/results");
  }

  function remove(id: string) {
    deleteEntry(id);
    setEntries(loadHistory());
  }

  function clearAll() {
    if (!confirm("Delete all saved analyses from this browser?")) return;
    clearHistory();
    setEntries([]);
  }

  if (!entries) return <p className="text-slate-500">Loading...</p>;

  if (!entries.length)
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="mt-3 text-slate-600">No analyses yet. Your results are saved here automatically.</p>
        <Link href="/analyze" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">New analysis</Link>
      </div>
    );

  const trend = entries.slice(0, 10).reverse().map((e) => e.result.total);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-sm text-slate-500">
            Saved in this browser only. Scores and feedback are kept, not your resume text.
          </p>
        </div>
        <button onClick={clearAll} className="text-sm text-slate-500 hover:text-red-600">Clear all</button>
      </div>

      {trend.length >= 2 && (
        <section className="flex items-center justify-between rounded-2xl border bg-white p-5">
          <div>
            <p className="text-sm font-semibold">Score trend</p>
            <p className="text-xs text-slate-500">Last {trend.length} analyses, oldest to newest</p>
          </div>
          <Sparkline values={trend} />
        </section>
      )}

      <ul className="space-y-3">
        {entries.map((e, i) => {
          const prev = entries[i + 1];
          const delta = prev ? e.result.total - prev.result.total : null;
          return (
            <li key={e.id} className="flex items-center gap-4 rounded-2xl border bg-white p-4">
              <button onClick={() => open(e.id)} className="flex flex-1 items-center gap-4 text-left">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${tone(e.result.total)}`}>
                  {e.result.total}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{e.fileName}</span>
                  <span className="block text-xs text-slate-500">
                    {new Date(e.date).toLocaleString()} · {e.hasJd ? (e.jdTitle ? `Tailored: ${e.jdTitle}` : "Tailored to a job description") : "General"}
                    {!e.result.aiIncluded && " · rules only"}
                  </span>
                </span>
              </button>
              {delta !== null && delta !== 0 && (
                <span className={`flex items-center gap-1 text-xs font-medium ${delta > 0 ? "text-green-700" : "text-red-700"}`}>
                  {delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {delta > 0 ? "+" : ""}{delta}
                </span>
              )}
              <button onClick={() => remove(e.id)} aria-label="Delete" className="text-slate-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}