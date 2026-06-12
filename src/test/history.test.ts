import { describe, expect, it, vi } from "vitest";
import { createHistoryEntry, prependHistoryEntry, type HistoryEntry } from "@/lib/history";
import type { BibleReference } from "@/lib/bible";

const reference: BibleReference = {
  id: "reference-1",
  book: "John",
  chapter: 3,
  verseStart: 16,
  verseEnd: null,
  raw: "John 3:16",
  version: "KJV",
  verseText: "For God so loved the world...",
};

describe("history entries", () => {
  it("records a successful microphone lookup immediately with its query", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");
    const entry = createHistoryEntry({
      query: " John 3:16 ",
      references: [reference],
      source: "microphone",
    });

    expect(entry).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      query: "John 3:16",
      references: [reference],
      failedSearches: 0,
      source: "microphone",
    });
  });

  it("records no-match searches and prepends new searches", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000002");
    const entry = createHistoryEntry({
      query: "unmatched words",
      references: [],
      source: "manual",
    });
    const existing = [{ ...entry, id: "older" }] satisfies HistoryEntry[];

    expect(prependHistoryEntry(existing, entry).map((item) => item.id)).toEqual([
      "00000000-0000-4000-8000-000000000002",
      "older",
    ]);
    expect(entry.failedSearches).toBe(1);
  });
});
