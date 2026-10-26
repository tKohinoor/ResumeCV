import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";

const bars = [
  { label: "Quantified impact", value: 82 },
  { label: "Action verbs", value: 74 },
  { label: "Structure", value: 90 },
  { label: "ATS-friendliness", value: 68 },
  { label: "Keyword match", value: 79 },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <FileText size={22} /> ResumeCV
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Know how your resume <span className="text-indigo-600">really scores</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-600">
            Upload your resume, add a job description if you have one, and get a score with
            clear, prioritized fixes in seconds.
          </p>
          <Link
            href="/analyze"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
          >
            Analyze my resume <ArrowRight size={18} />
          </Link>
        </div>

        {/* Mock results card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ScoreRing score={78} />
            <div className="w-full space-y-3">
              {bars.map((b) => (
                <div key={b.label}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600">
                    <span>{b.label}</span>
                    <span>{b.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${b.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}