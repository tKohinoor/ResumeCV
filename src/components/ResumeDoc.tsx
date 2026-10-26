import { CONTACT, HEADINGS, NAME, sectionOrder, type SectionId, type Template } from "@/lib/templates/data";

function H({ id }: { id: SectionId }) {
  return (
    <h3 className="mb-1 mt-3 border-b border-slate-400 pb-0.5 text-[11px] font-bold uppercase tracking-wide">
      {HEADINGS[id]}
    </h3>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="ml-4 list-disc space-y-0.5">
      {items.map((b) => <li key={b}>{b}</li>)}
    </ul>
  );
}

function Section({ id, t }: { id: SectionId; t: Template }) {
  const r = t.resume;
  return (
    <div>
      <H id={id} />
      {id === "summary" && <p>{r.summary}</p>}
      {id === "skills" && r.skills.map((s) => <p key={s.label}><b>{s.label}:</b> {s.items}</p>)}
      {id === "experience" && r.experience.map((x) => (
        <div key={x.title + x.dates} className="mb-1.5">
          <p><b>{x.title}</b> | {x.org} | {x.dates}</p>
          <Bullets items={x.bullets} />
        </div>
      ))}
      {id === "projects" && r.projects.map((p) => (
        <div key={p.name} className="mb-1.5">
          <p><b>{p.name}</b> | {p.dates}</p>
          <Bullets items={p.bullets} />
        </div>
      ))}
      {id === "education" && r.education.map((e) => (
        <div key={e.degree}>
          <p><b>{e.degree}</b> | {e.school} | {e.dates}</p>
          {e.detail && <p>{e.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export default function ResumeDoc({ t }: { t: Template }) {
  return (
    <div className="bg-white text-[11px] leading-snug text-slate-900">
      <p className="text-center text-xl font-bold">{NAME}</p>
      <p className="text-center">{CONTACT}</p>
      {sectionOrder(t).map((id) => <Section key={id} id={id} t={t} />)}
    </div>
  );
}