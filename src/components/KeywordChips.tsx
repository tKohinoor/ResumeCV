export default function KeywordChips({ matched, missing }: { matched: string[]; missing: string[] }) {
  const chip = "rounded-full px-3 py-1 text-xs font-medium";
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-red-700">Missing ({missing.length})</h3>
        <div className="flex flex-wrap gap-2">
          {missing.length ? missing.map((k) => <span key={k} className={`${chip} bg-red-50 text-red-700`}>{k}</span>)
            : <span className="text-xs text-slate-500">Nothing missing.</span>}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-green-700">Matched ({matched.length})</h3>
        <div className="flex flex-wrap gap-2">
          {matched.length ? matched.map((k) => <span key={k} className={`${chip} bg-green-50 text-green-700`}>{k}</span>)
            : <span className="text-xs text-slate-500">No matches found.</span>}
        </div>
      </div>
    </div>
  );
}