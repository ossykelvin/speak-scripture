import { type HistoryEntry } from "@/lib/history";

export type Period = "daily" | "weekly" | "monthly" | "all-time";

export interface AnalyticsSummary {
  sessions: number;
  totalReferences: number;
  failedSearches: number;
  totalDuration: number;
  topBooks: { book: string; count: number }[];
}

function isInRange(dateStr: string, start: Date, end: Date): boolean {
  const date = new Date(dateStr);
  return date >= start && date <= end;
}

export function getRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;

  if (period === "all-time") {
    start = new Date(0);
  } else if (period === "daily") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (period === "weekly") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  return { start, end };
}

export function computeAnalytics(history: HistoryEntry[], period: Period): AnalyticsSummary {
  const { start, end } = getRange(period);
  const filtered = history.filter((entry) => isInRange(entry.date, start, end));
  const bookCounts: Record<string, number> = {};
  let totalReferences = 0;
  let failedSearches = 0;
  let totalDuration = 0;

  for (const entry of filtered) {
    totalReferences += entry.references.length;
    failedSearches += entry.failedSearches ?? 0;
    totalDuration += entry.duration;
    for (const reference of entry.references) {
      bookCounts[reference.book] = (bookCounts[reference.book] || 0) + 1;
    }
  }

  const topBooks = Object.entries(bookCounts)
    .map(([book, count]) => ({ book, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { sessions: filtered.length, totalReferences, failedSearches, totalDuration, topBooks };
}
