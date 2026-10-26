import type { ScoreResult } from "@/lib/scoring/types";
import type { ResumeAiData } from "@/lib/ai/schemas";

export type HistoryEntry = {
  id: string;
  date: number;
  fileName: string;
  hasJd: boolean;
  jdTitle?: string;
  result: ScoreResult;
  ai: ResumeAiData | null; // bullets are always stored empty (no resume text)
};

const KEY = "resumecv:history:v1";
const MAX = 50;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage full or blocked: history is a convenience, never break the app
  }
}

// Insert a new entry, or update an existing one (same id) keeping its original date.
export function saveEntry(entry: Omit<HistoryEntry, "date">) {
  const list = loadHistory();
  const i = list.findIndex((e) => e.id === entry.id);
  if (i >= 0) list[i] = { ...entry, date: list[i].date };
  else list.unshift({ ...entry, date: Date.now() });
  write(list.sort((a, b) => b.date - a.date));
}

export function getEntry(id: string) {
  return loadHistory().find((e) => e.id === id) ?? null;
}

export function deleteEntry(id: string) {
  write(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory() {
  write([]);
}