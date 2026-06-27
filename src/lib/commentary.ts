import { formatBibleReference, type BibleReference } from "@/lib/bible";
import type { HistoryEntry } from "@/lib/history";

export interface CommentaryTarget {
  key: string;
  reference: BibleReference;
  query?: string;
  date: string;
}

export function getCommentaryTargets(history: HistoryEntry[]): CommentaryTarget[] {
  const targets = new Map<string, CommentaryTarget>();

  for (const entry of history) {
    for (const reference of entry.references) {
      const key = formatBibleReference(reference).toLowerCase();
      if (targets.has(key)) continue;
      targets.set(key, {
        key,
        reference,
        query: entry.query,
        date: entry.date,
      });
    }
  }

  return [...targets.values()];
}
