import { type BibleReference } from "@/lib/bible";
import type { Json } from "@/integrations/supabase/types";

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
export const HISTORY_SYNC_LIMIT = MAX_HISTORY_ENTRIES;

export interface RemoteHistoryRow {
  id: string;
  searched_at: string;
  duration: number;
  scripture_references: Json;
  failed_searches: number;
  source: string | null;
  query: string | null;
}

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

export function hasBibleReferences(entry: Pick<HistoryEntry, "references">): boolean {
  return entry.references.length > 0;
}

export function scriptureHistoryOnly(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.filter(hasBibleReferences);
}

export function prependHistoryEntry(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
}

export function mergeHistory(...groups: HistoryEntry[][]): HistoryEntry[] {
  const byId = new Map<string, HistoryEntry>();
  for (const entry of groups.flat()) {
    const existing = byId.get(entry.id);
    if (!existing || new Date(entry.date) > new Date(existing.date)) {
      byId.set(entry.id, entry);
    }
  }
  return [...byId.values()]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_HISTORY_ENTRIES);
}

export function applyAuthoritativeCloudHistory(
  localHistoryAtLogin: HistoryEntry[],
  currentHistory: HistoryEntry[],
  remoteHistory: HistoryEntry[],
): HistoryEntry[] {
  const staleLocalIds = new Set(localHistoryAtLogin.map((entry) => entry.id));
  const currentSessionEntries = currentHistory.filter((entry) => !staleLocalIds.has(entry.id));
  return mergeHistory(currentSessionEntries, remoteHistory);
}

export function getHistoryStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

export function loadHistory(userId?: string | null): HistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(getHistoryStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[], userId?: string | null) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(getHistoryStorageKey(userId), JSON.stringify(entries));
  } catch (error) {
    console.error("Unable to save scripture history:", error);
  }
}

export function clearGuestHistory() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function historyEntryToRemote(entry: HistoryEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    searched_at: entry.date,
    duration: entry.duration,
    scripture_references: entry.references as unknown as Json,
    failed_searches: entry.failedSearches ?? 0,
    source: entry.source ?? null,
    query: entry.query ?? null,
  };
}

export function remoteRowToHistoryEntry(row: RemoteHistoryRow): HistoryEntry {
  return {
    id: row.id,
    date: row.searched_at,
    duration: row.duration,
    references: Array.isArray(row.scripture_references)
      ? row.scripture_references as unknown as BibleReference[]
      : [],
    failedSearches: row.failed_searches,
    source: row.source === "microphone" || row.source === "manual" ? row.source : undefined,
    query: row.query ?? undefined,
  };
}
