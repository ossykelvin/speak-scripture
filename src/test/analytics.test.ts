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
});
