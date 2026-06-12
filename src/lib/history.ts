import { type BibleReference } from "@/lib/bible";

export interface HistoryEntry {
  id: string;
  date: string;
  duration: number;
  references: BibleReference[];
  failedSearches?: number;
  source?: "microphone" | "manual";
  query?: string;
}

const STORAGE_KEY = "scripture-listener-history";
const MAX_HISTORY_ENTRIES = 200;

export function createHistoryEntry({
  query,
  references,
  source,
  duration = 0,
}: {
  query: string;
  references: BibleReference[];
  source: "microphone" | "manual";
  duration?: number;
}): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    duration,
    references,
    failedSearches: references.length === 0 ? 1 : 0,
    source,
    query: query.trim(),
  };
}

export function prependHistoryEntry(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
}

export function loadHistory(): HistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Unable to save scripture history:", error);
  }
}
