export type SectionKey =
  | "header" | "summary" | "experience" | "education"
  | "skills" | "projects" | "certifications" | "other";

const ALIASES: Record<Exclude<SectionKey, "header" | "other">, string[]> = {
  summary: ["summary", "professional summary", "profile", "objective", "career objective", "about me", "about"],
  experience: ["experience", "work experience", "professional experience", "work history", "employment history", "employment", "internships", "internship experience"],
  education: ["education", "academic background", "academics", "qualifications", "education and training"],
  skills: ["skills", "technical skills", "core skills", "key skills", "skills and tools", "technologies", "core competencies"],
  projects: ["projects", "personal projects", "academic projects", "key projects"],
  certifications: ["certifications", "certificates", "licenses", "courses", "achievements", "awards"],
};

const HEADING_LOOKUP = new Map<string, SectionKey>();
for (const [key, list] of Object.entries(ALIASES))
  for (const a of list) HEADING_LOOKUP.set(a, key as SectionKey);

function headingOf(line: string): SectionKey | null {
  const clean = line.trim().replace(/[:\-–_]+$/, "").replace(/&/g, "and").toLowerCase();
  if (!clean || clean.split(/\s+/).length > 4) return null;
  return HEADING_LOOKUP.get(clean) ?? null;
}

export type Sections = Record<SectionKey, string[]>;

export function detectSections(text: string): Sections {
  const sections: Sections = {
    header: [], summary: [], experience: [], education: [],
    skills: [], projects: [], certifications: [], other: [],
  };
  let current: SectionKey = "header";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const h = headingOf(line);
    if (h) { current = h; continue; }
    sections[current].push(line);
  }
  return sections;
}

const BULLET = /^[\u2022\u25CF\u25AA\u25E6\u2023\u2043•·▪►➢*\-–]\s*/;

export function extractBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  const hasMarkers = lines.some((l) => BULLET.test(l));
  for (const line of lines) {
    if (BULLET.test(line)) {
      bullets.push(line.replace(BULLET, "").trim());
    } else if (hasMarkers) {
      // wrapped continuation of the previous bullet
      if (bullets.length && /^[a-z(]/.test(line)) bullets[bullets.length - 1] += " " + line;
    } else if (line.split(/\s+/).length >= 8) {
      bullets.push(line); // unmarked résumé: treat long lines as bullets
    }
  }
  return bullets.filter((b) => b.length > 0);
}

export type Contact = { email: boolean; phone: boolean; linkedin: boolean; github: boolean };

export function detectContact(text: string): Contact {
  return {
    email: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text),
    phone: /\+?\d[\d\s().-]{8,16}\d/.test(text),
    linkedin: /linkedin\.com/i.test(text),
    github: /github\.com/i.test(text),
  };
}