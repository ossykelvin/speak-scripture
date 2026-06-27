import { describe, expect, it, vi } from "vitest";
import { computeAnalytics } from "@/lib/analytics";
import type { HistoryEntry } from "@/lib/history";

describe("analytics", () => {
  it("counts successful references and failed searches", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00"));
    const history: HistoryEntry[] = [{
      id: "session-1",
      date: "2026-06-11T10:00:00",
      duration: 90,
      failedSearches: 2,
      references: [{
        id: "ref-1",
        book: "John",
        chapter: 3,
        verseStart: 16,
        raw: "John 3:16",
        version: "KJV",
      }],
    }];

    expect(computeAnalytics(history, "daily")).toMatchObject({
      sessions: 1,
      totalReferences: 1,
      failedSearches: 2,
      totalDuration: 90,
      topBooks: [{ book: "John", count: 1 }],
    });
    vi.useRealTimers();
  });

  it("can compute all-time analytics across every history entry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00"));
    const history: HistoryEntry[] = [
      {
        id: "session-1",
        date: "2026-06-11T10:00:00",
        duration: 90,
        failedSearches: 0,
        references: [{
          id: "ref-1",
          book: "John",
          chapter: 3,
          verseStart: 16,
          raw: "John 3:16",
          version: "KJV",
        }],
      },
      {
        id: "session-2",
        date: "2025-01-01T10:00:00",
        duration: 30,
        failedSearches: 1,
        references: [{
          id: "ref-2",
          book: "Psalms",
          chapter: 23,
          verseStart: 1,
          raw: "Psalm 23:1",
          version: "KJV",
        }],
      },
    ];

    expect(computeAnalytics(history, "all-time")).toMatchObject({
      sessions: 2,
      totalReferences: 2,
      failedSearches: 1,
      totalDuration: 120,
    });
    vi.useRealTimers();
  });
});
