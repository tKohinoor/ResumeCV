export type Category = {
    key: string;
    label: string;
    score: number;
    max: number;
    issues: string[];
};

export type Fix = { text: string; points: number };

export type ScoreResult = {
    total: number;
    hasJd: boolean;
    categories: Category[];
    fixes: Fix[];
    keywords: { matched: string[]; missing: string[]; coverage: number } | null;
    aiIncluded: boolean;
};