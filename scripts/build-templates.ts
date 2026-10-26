import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { CONTACT, HEADINGS, NAME, TEMPLATES, sectionOrder, type SectionId, type Template } from "../src/lib/templates/data";

const FONT = "Calibri";
const run = (text: string, o: { bold?: boolean; size?: number } = {}) =>
  new TextRun({ text, font: FONT, size: o.size ?? 21, bold: o.bold });

const heading = (text: string) =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "808080", space: 1 } },
    children: [run(text.toUpperCase(), { bold: true, size: 22 })],
  });

const line = (...runs: TextRun[]) => new Paragraph({ spacing: { after: 40 }, children: runs });
const bullet = (t: string) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [run(t)] });

function section(id: SectionId, t: Template): Paragraph[] {
  const r = t.resume;
  const out: Paragraph[] = [heading(HEADINGS[id])];
  if (id === "summary") out.push(line(run(r.summary)));
  if (id === "skills") r.skills.forEach((s) => out.push(line(run(`${s.label}: `, { bold: true }), run(s.items))));
  if (id === "experience")
    r.experience.forEach((x) => {
      out.push(line(run(x.title, { bold: true }), run(` | ${x.org} | ${x.dates}`)));
      x.bullets.forEach((b) => out.push(bullet(b)));
    });
  if (id === "projects")
    r.projects.forEach((p) => {
      out.push(line(run(p.name, { bold: true }), run(` | ${p.dates}`)));
      p.bullets.forEach((b) => out.push(bullet(b)));
    });
  if (id === "education")
    r.education.forEach((e) => {
      out.push(line(run(e.degree, { bold: true }), run(` | ${e.school} | ${e.dates}`)));
      if (e.detail) out.push(line(run(e.detail)));
    });
  return out;
}

function build(t: Template) {
  return new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [run(NAME, { bold: true, size: 36 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [run(CONTACT)] }),
          ...sectionOrder(t).flatMap((id) => section(id, t)),
        ],
      },
    ],
  });
}

async function main() {
  const dir = path.join(process.cwd(), "public", "templates");
  mkdirSync(dir, { recursive: true });
  for (const t of TEMPLATES) {
    writeFileSync(path.join(dir, `${t.id}.docx`), await Packer.toBuffer(build(t)));
    console.log("wrote", `${t.id}.docx`);
  }
}

main();