"use client";
import { useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { parseResume, type ParsedResume } from "@/lib/parse";

const MAX_MB = 5;
const ALLOWED = [".pdf", ".docx"];

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [jd, setJd] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const jdWords = jd.trim() ? jd.trim().split(/\s+/).length : 0;

  async function pick(f?: File) {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED.includes(ext)) return setError("Please upload a PDF or DOCX file.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File is larger than ${MAX_MB} MB.`);

    setError(""); setFile(f); setParsed(null); setSubmitted(false); setParsing(true);
    try {
      setParsed(await parseResume(f));
    } catch (e) {
      setFile(null);
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally {
      setParsing(false);
    }
  }

  function remove() { setFile(null); setParsed(null); setSubmitted(false); setError(""); }

  function analyze() {
    if (!parsed) return;
    sessionStorage.setItem("resumecv:pending", JSON.stringify({ parsed, jd }));
    setSubmitted(true); // step 3 will navigate to /results here
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">New analysis</h1>
      <p className="mt-1 text-slate-600">Upload your resume. Add a job description for a tailored score.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="flex h-[420px] flex-col rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Your resume</h2>
          <p className="mb-3 text-sm text-slate-500">PDF or DOCX, up to {MAX_MB} MB</p>

          <div
            onClick={() => !file && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
            className={`flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition ${
              file ? "" : "cursor-pointer"
            } ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400"}`}
          >
            <input
              ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <FileText className="text-indigo-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  {parsing && (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 size={12} className="animate-spin" /> Reading file...
                    </p>
                  )}
                  {parsed && (
                    <p className="flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle2 size={12} />
                      {parsed.wordCount} words
                      {parsed.pageCount ? ` · ${parsed.pageCount} page${parsed.pageCount > 1 ? "s" : ""}` : ""}
                      {" · "}{Object.entries(parsed.sections).filter(([k, v]) => k !== "header" && k !== "other" && v.length).length} sections found
                    </p>
                  )}
                </div>
                <button onClick={remove} aria-label="Remove file"><X size={16} /></button>
              </div>
            ) : (
              <>
                <UploadCloud size={36} className="text-slate-400" />
                <p className="mt-2 text-sm font-medium">Drag and drop, or click to browse</p>
              </>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        <section className="flex h-[420px] flex-col rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Job description <span className="font-normal text-slate-400">(optional)</span></h2>
            <span className="text-xs text-slate-500">{jdWords} words</span>
          </div>
          <p className="mb-3 text-sm text-slate-500">Paste a job description for a tailored score.</p>
          <textarea
            value={jd} onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here..."
            className="flex-1 resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
          />
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={analyze}
          disabled={!parsed || parsing}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze
        </button>
      </div>

      {/* TEMPORARY: remove in step 3 */}
      {submitted && parsed && (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm">
          <h3 className="font-semibold">Parse preview (temporary)</h3>
          <p className="mt-2 text-slate-600">
            Contact detected: {Object.entries(parsed.contact).map(([k, v]) => `${k} ${v ? "✓" : "✗"}`).join(" · ")}
          </p>
          <p className="text-slate-600">Bullets found: {parsed.bullets.length}</p>
          <p className="mt-3 font-medium">Text that would be sent to Gemini:</p>
          <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
            {parsed.redactedText}
          </pre>
        </section>
      )}
    </div>
  );
}