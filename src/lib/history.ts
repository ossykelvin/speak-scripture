import { type BibleReference } from "@/lib/bible";

export interface HistoryEntry {
  id: string;
  date: string;
  duration: number;
  references: BibleReference[];
  failedSearches?: number;
  source?: "microphone" | "manual";
}

const STORAGE_KEY = "scripture-listener-history";

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
