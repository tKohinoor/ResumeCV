"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileSearch } from "lucide-react";
import ResumeDoc from "@/components/ResumeDoc";
import { TEMPLATES, type Template } from "@/lib/templates/data";

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alt = [...terms].sort((a, b) => b.length - a.length).map(esc).join("|");
  const parts = text.split(new RegExp(`(?<![A-Za-z0-9])(${alt})(?![A-Za-z0-9])`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <mark key={i} className="rounded bg-indigo-100 px-0.5 text-indigo-900">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

const btnPrimary = "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700";
const btnGhost = "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50";

export default function TemplatesPage() {
  const router = useRouter();
  const [sel, setSel] = useState<Template | null>(null);

  function startWithJd(t: Template) {
    sessionStorage.setItem("resumecv:jdpreset", t.jd.text);
    router.push("/analyze");
  }

  if (sel)
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <button onClick={() => setSel(null)} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600">
          <ArrowLeft size={16} /> All templates
        </button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{sel.name}</h1>
            <p className="text-sm text-slate-500">
              Sample content is fictional. Replace every number with your own real figures.
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/templates/${sel.id}.docx`} download className={btnGhost}><Download size={16} /> Download DOCX</a>
            <button onClick={() => startWithJd(sel)} className={btnPrimary}><FileSearch size={16} /> Use this JD</button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="flex h-[640px] flex-col rounded-2xl border bg-white p-5">
            <h2 className="mb-3 font-semibold">Template with sample content</h2>
            <div className="flex-1 overflow-auto rounded-lg border bg-white p-6 shadow-inner">
              <ResumeDoc t={sel} />
            </div>
          </section>
          <section className="flex h-[640px] flex-col rounded-2xl border bg-white p-5">
            <h2 className="mb-1 font-semibold">Sample job description: {sel.jd.title}</h2>
            <p className="mb-3 text-xs text-slate-500">Highlighted terms are the skills a strong resume should show.</p>
            <div className="flex-1 overflow-auto whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm leading-relaxed">
              <Highlighted text={sel.jd.text} terms={sel.jd.keySkills} />
            </div>
          </section>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Templates</h1>
      <p className="mt-1 text-slate-600">
        ATS-friendly resume templates, each paired with a sample job description to practice against.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <article key={t.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white">
            <button onClick={() => setSel(t)} className="relative h-64 overflow-hidden bg-slate-100 text-left" aria-label={`Preview ${t.name}`}>
              <div
                className="pointer-events-none mt-4 bg-white p-6 shadow"
                style={{ width: 600, transform: "scale(0.42)", transformOrigin: "top center", marginLeft: "calc(50% - 300px)" }}
              >
                <ResumeDoc t={t} />
              </div>
            </button>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="text-xs text-slate-500">{t.level}</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-slate-600">{t.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setSel(t)} className={btnGhost}>Preview</button>
                <a href={`/templates/${t.id}.docx`} download className={btnGhost}><Download size={16} /> DOCX</a>
                <button onClick={() => startWithJd(t)} className={btnPrimary}>Use this JD</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}