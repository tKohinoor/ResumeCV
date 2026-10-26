import type { Category } from "@/lib/scoring/types";

export default function CategoryBar({ c }: { c: Category }) {
  const ratio = c.score / c.max;
  const color = ratio >= 0.8 ? "bg-green-500" : ratio >= 0.55 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{c.label}</span>
        <span className="text-slate-500">{c.score} / {c.max}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      {c.issues.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {c.issues.map((i) => <li key={i}>• {i}</li>)}
        </ul>
      )}
    </div>
  );
}