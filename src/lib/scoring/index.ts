import type { ParsedResume } from "@/lib/parse";
import type { Category, Fix, ScoreResult } from "./types";
import { startsStrong, WEAK_PHRASES } from "./verbs";
import { extractJdTerms, matchTerms, matchesTerm, normalize, titleAlignment } from "./jd";

const W_BASE = { impact: 25, verbs: 20, structure: 20, ats: 15, length: 10, skills: 10 };
const W_JD = { keywords: 35, title: 10, impact: 15, verbs: 10, structure: 10, ats: 10, length: 5, skills: 5 };

const LABELS: Record<string, string> = {
  impact: "Quantified impact", verbs: "Action verbs & clarity", structure: "Structure & sections",
  ats: "ATS-friendliness", length: "Length & density", skills: "Skills section",
  keywords: "Keyword match", title: "Title alignment",
};

type R = { ratio: number; issues: string[] };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const pct = (n: number) => Math.round(n * 100);

function impact(bullets: string[]): R {
  if (!bullets.length)
    return { ratio: 0, issues: ["We couldn't find bullet points under Experience or Projects. Use bullets that start with an action and end with a result."] };
  const withNum = bullets.filter((b) => /\d|[%$₹€£]/.test(b)).length;
  const share = withNum / bullets.length;
  const issues = share < 0.6
    ? [`Only ${withNum} of ${bullets.length} bullets include a number, percentage or scale. Aim for at least 60%.`]
    : [];
  return { ratio: clamp(share / 0.6), issues };
}

function verbs(bullets: string[]): R {
  if (!bullets.length) return { ratio: 0, issues: [] };
  const strong = bullets.filter(startsStrong).length;
  const weakPhrases = bullets.filter((b) => WEAK_PHRASES.test(b)).length;
  const firstPerson = bullets.some((b) => /\b(I|my|me)\b/.test(b));
  const issues: string[] = [];
  if (strong / bullets.length < 0.8) issues.push(`${bullets.length - strong} of ${bullets.length} bullets don't start with a strong action verb (e.g. Built, Led, Reduced).`);
  if (weakPhrases) issues.push(`${weakPhrases} bullet(s) use weak phrases like "responsible for" or "worked on". Say what you actually did and achieved.`);
  if (firstPerson) issues.push('Remove first-person words ("I", "my") from bullets.');
  const ratio = clamp(strong / bullets.length / 0.8 - weakPhrases * 0.05 - (firstPerson ? 0.1 : 0));
  return { ratio, issues };
}

function structure(p: ParsedResume): R {
  const s = p.sections;
  const items: [boolean, number, string][] = [
    [p.contact.email, 0.15, "Add a professional email address."],
    [p.contact.phone, 0.1, "Add a phone number."],
    [s.experience.length + s.projects.length > 0, 0.25, "Add an Experience or Projects section with a standard heading."],
    [s.education.length > 0, 0.2, "Add an Education section."],
    [s.skills.length > 0, 0.2, "Add a Skills section."],
    [p.contact.linkedin || p.contact.github, 0.1, "Add a LinkedIn or GitHub link."],
  ];
  return {
    ratio: items.reduce((a, [ok, w]) => a + (ok ? w : 0), 0),
    issues: items.filter(([ok]) => !ok).map(([, , msg]) => msg),
  };
}

function ats(p: ParsedResume): R {
  let ratio = 1;
  const issues: string[] = [];
  const found = Object.entries(p.sections).filter(([k, v]) => k !== "header" && k !== "other" && v.length).length;
  if (found < 3) { ratio -= 0.3; issues.push("Fewer than 3 standard section headings were detected. Use plain headings like Experience, Education, Skills."); }

  const months = (p.rawText.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/gi) ?? []).length;
  const numeric = (p.rawText.match(/\b\d{1,2}\/\d{4}\b/g) ?? []).length;
  if (months && numeric) { ratio -= 0.2; issues.push('Dates use mixed formats ("Jan 2022" and "01/2022"). Pick one.'); }

  if (/[\uE000-\uF8FF\uFFFD]/.test(p.rawText)) { ratio -= 0.3; issues.push("Some characters didn't extract cleanly (icons or special fonts). Replace them with plain text."); }

  if (!/\b(19|20)\d{2}\b/.test([...p.sections.experience, ...p.sections.education].join(" "))) {
    ratio -= 0.2; issues.push("No dates were found in Experience or Education. Add start and end dates.");
  }
  return { ratio: clamp(ratio), issues };
}

function length(p: ParsedResume): R {
  const w = p.wordCount;
  let ratio = 1;
  const issues: string[] = [];
  if (w < 400) { ratio = clamp(w / 400); issues.push(`Your resume is short (${w} words). 400–800 words is the usual sweet spot.`); }
  else if (w > 800) { ratio = Math.max(0.3, 1 - (w - 800) / 800); issues.push(`Your resume is long (${w} words). Trim older or less relevant details.`); }
  if (p.pageCount && p.pageCount > 2) { ratio = clamp(ratio - 0.2); issues.push(`It runs ${p.pageCount} pages. Keep it to 1–2.`); }
  return { ratio, issues };
}

function skills(p: ParsedResume): R {
  const items = [...new Set(
    p.sections.skills
      .flatMap((l) => l.replace(/^[^:]{1,30}:/, "").split(/[,|•·;]|\s{2,}/))
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 40)
  )];
  if (!items.length) return { ratio: 0, issues: ["No skills section found. List your key tools and technologies."] };

  const issues: string[] = [];
  let ratio = items.length < 5 ? 0.4 : items.length < 8 ? 0.7 : items.length <= 40 ? 1 : 0.6;
  if (items.length < 8) issues.push(`Only ${items.length} skills listed. Aim for 8 or more relevant ones.`);
  if (items.length > 40) issues.push("The skills list is very long. Keep the most relevant 15–25.");

  const others = normalize([...p.sections.experience, ...p.sections.projects, ...p.sections.summary].join("\n"));
  const sample = items.slice(0, 30).map(normalize);
  const shown = sample.filter((s) => matchesTerm(others, s)).length;
  if (items.length >= 8 && shown / sample.length < 0.25) {
    ratio -= 0.2;
    issues.push("Most listed skills never appear in your experience or projects. Show them in action in your bullets.");
  }
  return { ratio: clamp(ratio), issues };
}

export function scoreResume(p: ParsedResume, jd: string): ScoreResult {
  const hasJd = jd.trim().split(/\s+/).filter(Boolean).length >= 30;
  const W: Record<string, number> = hasJd ? W_JD : W_BASE;

  const parts: Record<string, R> = {
    impact: impact(p.bullets), verbs: verbs(p.bullets), structure: structure(p),
    ats: ats(p), length: length(p), skills: skills(p),
  };

  let keywords: ScoreResult["keywords"] = null;
  if (hasJd) {
    const terms = extractJdTerms(jd);
    keywords = matchTerms(terms, p.rawText);
    const kIssues = keywords.missing.length
      ? [`Missing ${keywords.missing.length} keywords from the job description. Add the ones that truthfully apply to you.`]
      : [];
    parts.keywords = { ratio: clamp(keywords.coverage / 0.7), issues: kIssues };
    const t = titleAlignment(jd, p.rawText);
    parts.title = { ratio: t.ratio, issues: t.issue ? [t.issue] : [] };
  }

  const order = hasJd
    ? ["keywords", "title", "impact", "verbs", "structure", "ats", "length", "skills"]
    : ["impact", "verbs", "structure", "ats", "length", "skills"];

  const categories: Category[] = order.map((key) => ({
    key, label: LABELS[key], max: W[key],
    score: Math.round(parts[key].ratio * W[key] * 10) / 10,
    issues: parts[key].issues,
  }));

  const fixes: Fix[] = categories
    .flatMap((c) => c.issues.map((text) => ({ text, points: (1 - c.score / c.max) * c.max / Math.max(1, c.issues.length) })))
    .filter((f) => f.points >= 0.5)
    .sort((a, b) => b.points - a.points)
    .slice(0, 6)
    .map((f) => ({ text: f.text, points: Math.round(f.points) }));

  return {
    total: Math.round(categories.reduce((a, c) => a + c.score, 0)),
    hasJd, categories, fixes, keywords,
  };
}