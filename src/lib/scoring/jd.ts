import type { JdData } from "@/lib/ai/schemas";

export type JdTerm = { term: string; weight: number; label?: string };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SYNONYMS: Record<string, string> = {
    js: "javascript", ts: "typescript", k8s: "kubernetes", ml: "machine learning",
    "node.js": "nodejs", node: "nodejs", "react.js": "react", reactjs: "react",
    "vue.js": "vue", vuejs: "vue", postgres: "postgresql", golang: "go",
    "ci/cd": "cicd", "ci-cd": "cicd", aws: "amazon web services", gcp: "google cloud",
    "ui/ux": "ux", "a/b testing": "ab testing", "ab test": "ab testing", nlp: "natural language processing",
    llm: "large language models", llms: "large language models", pm: "product management",
    seo: "search engine optimization", sql: "sql", "power bi": "powerbi", "ms excel": "excel",
};

export function normalize(text: string): string {
    let t = text.toLowerCase();
    for (const [from, to] of Object.entries(SYNONYMS)) {
        t = t.replace(new RegExp(`(?<![a-z0-9+#])${esc(from)}(?![a-z0-9+#])`, "g"), to);
    }
    return t;
}

export function matchesTerm(normText: string, term: string): boolean {
    return new RegExp(`(?<![a-z0-9+#])${esc(term)}(?![a-z0-9+#])`).test(normText);
}

const STOP = new Set(`a an the and or but if of to in on at by for with from as is are was were be been being
this that these those it its we our you your they their he she i me my us who whom which what when where why how
will would can could should may might must shall do does did have has had not no yes so than then too very just
also about into over under between among within across per via etc more most other such only own same both each
any all some few able ability strong excellent good great experience experienced years year skills skill knowledge
role roles company job jobs team teams work working works candidate candidates join position responsibilities
responsibility requirements requirement preferred required including include includes plus bonus using use used
new help helping looking seeking ideal opportunity environment business needs need related relevant etc based
well high highly proven demonstrated understanding passion passionate fast paced fast-paced day daily time full
part remote hybrid onsite location apply application qualified qualifications minimum least ensure build building
develop developing provide providing support supporting drive driving make making take taking get getting`.split(/\s+/));

function isStop(tok: string) {
    if (STOP.has(tok) || /^\d+$/.test(tok)) return true;
    return tok.length < 2 && !["c", "r"].includes(tok);
}

function tokens(seg: string): string[] {
    return (seg.match(/[a-z0-9][a-z0-9+#.\-]*/g) ?? []).map((t) => t.replace(/[.\-]+$/, ""));
}

function requiredBlock(jd: string): string {
    const req: string[] = [];
    let mode: "req" | "other" = "other";
    for (const raw of jd.split("\n")) {
        const l = raw.trim();
        if (!l) continue;
        const isHeading = l.length < 60 && !/^[•\-*·]/.test(l);
        if (isHeading && /requirements?|qualifications?|must[- ]have|what you.{0,3}ll need|you have|required/i.test(l)) { mode = "req"; continue; }
        if (isHeading && /preferred|nice to have|bonus|good to have|responsibilit|about (the|us)|what you.{0,3}ll do|benefits|perks|we offer/i.test(l)) { mode = "other"; continue; }
        if (mode === "req") req.push(l);
    }
    return normalize(req.join("\n"));
}

// STEP 4: Gemini-extracted skills will replace this function.
export function extractJdTerms(jd: string): JdTerm[] {
    const norm = normalize(jd);
    const reqNorm = requiredBlock(jd);
    const caps = new Set((jd.match(/\b[A-Z][A-Za-z0-9+#.]{2,}\b/g) ?? []).map((w) => normalize(w)));

    const uni = new Map<string, number>();
    const bi = new Map<string, number>();
    for (const seg of norm.split(/[\n,;:()|•]|\.\s/)) {
        let prev: string | null = null;
        for (const tok of tokens(seg)) {
            if (isStop(tok)) { prev = null; continue; }
            uni.set(tok, (uni.get(tok) ?? 0) + 1);
            if (prev) { const b = `${prev} ${tok}`; bi.set(b, (bi.get(b) ?? 0) + 1); }
            prev = tok;
        }
    }

    const picked: { term: string; s: number }[] = [];
    for (const [b, n] of bi) if (n >= 2) picked.push({ term: b, s: n + 1 });
    const inBigram = new Set(picked.flatMap((p) => p.term.split(" ")));
    for (const [u, n] of uni) {
        if (inBigram.has(u)) continue;
        if (n >= 2 || caps.has(u)) picked.push({ term: u, s: n + (caps.has(u) ? 0.5 : 0) });
    }

    return picked
        .sort((a, b) => b.s - a.s)
        .slice(0, 30)
        .map(({ term, s }) => ({
            term,
            weight: (reqNorm && matchesTerm(reqNorm, term) ? 2 : 1) + (s >= 3 ? 0.5 : 0),
        }));
}

export function termsFromJd(d: JdData): JdTerm[] {
    const seen = new Set<string>();
    const out: JdTerm[] = [];
    const add = (raw: string, weight: number) => {
        const label = raw.trim().toLowerCase();
        const term = normalize(label);
        if (!term || seen.has(term)) return;
        seen.add(term);
        out.push({ term, weight, label });
    };
    d.required.slice(0, 25).forEach((s) => add(s, 2));
    d.preferred.slice(0, 15).forEach((s) => add(s, 1));
    return out;
}

export function matchTerms(terms: JdTerm[], resumeText: string) {
    const norm = normalize(resumeText);
    const matched: string[] = [];
    const missing: string[] = [];
    let got = 0, total = 0;
    for (const { term, weight, label } of terms) {
        total += weight;
        const shown = label ?? term;
        if (matchesTerm(norm, term)) { matched.push(shown); got += weight; } else missing.push(shown);
    }
    return { matched, missing, coverage: total ? got / total : 0 };
}

// Heuristic until the AI returns a real job title (step 4).
export function titleAlignment(jd: string, resumeText: string, titleOverride?: string): { ratio: number; issue?: string } {
    const lines = jd.split("\n").map((l) => l.trim()).filter(Boolean);
    const labelled = lines.map((l) => l.match(/^(?:job title|role|position)\s*[:\-]\s*(.+)$/i)?.[1]).find(Boolean);
    const title = titleOverride ?? labelled ?? lines.find((l) => l.split(/\s+/).length <= 10);
    if (!title) return { ratio: 0.6 };
    const words = tokens(normalize(title)).filter((t) => !isStop(t) && !/^(senior|junior|lead|sr|jr|ii|iii)$/.test(t));
    if (!words.length) return { ratio: 0.6 };
    const norm = normalize(resumeText);
    const hit = words.filter((w) => matchesTerm(norm, w)).length;
    const ratio = hit / words.length;
    return ratio < 0.7
        ? { ratio, issue: `The target role ("${title}") isn't reflected in your titles, summary or experience. Mirror its wording where it's true.` }
        : { ratio };
}