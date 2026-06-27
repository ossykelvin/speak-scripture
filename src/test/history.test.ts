import { describe, expect, it, vi } from "vitest";
import {
  applyAuthoritativeCloudHistory,
  createHistoryEntry,
  getHistoryStorageKey,
  historyEntryToRemote,
  mergeHistory,
  prependHistoryEntry,
  remoteRowToHistoryEntry,
  scriptureHistoryOnly,
  type HistoryEntry,
} from "@/lib/history";
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

  it("marks no-match searches but filters them out of scripture history", () => {
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
    expect(scriptureHistoryOnly([entry])).toEqual([]);
  });

  it("merges device and cloud history by id in newest-first order", () => {
    const older = {
      ...createHistoryEntry({ query: "John 3:16", references: [reference], source: "manual" }),
      id: "older",
      date: "2026-06-10T10:00:00.000Z",
    };
    const newer = {
      ...older,
      id: "newer",
      date: "2026-06-11T10:00:00.000Z",
    };

    expect(mergeHistory([older], [newer, older]).map((entry) => entry.id)).toEqual(["newer", "older"]);
  });

  it("replaces login-time local history with cloud history while retaining new session entries", () => {
    const staleLocal = {
      ...createHistoryEntry({ query: "local only", references: [], source: "manual" }),
      id: "stale-local",
      date: "2026-06-10T10:00:00.000Z",
    };
    const remote = {
      ...createHistoryEntry({ query: "Romans 8:28", references: [reference], source: "manual" }),
      id: "remote",
      date: "2026-06-11T10:00:00.000Z",
    };
    const currentSession = {
      ...createHistoryEntry({ query: "Psalm 23", references: [reference], source: "manual" }),
      id: "current-session",
      date: "2026-06-12T10:00:00.000Z",
    };

    expect(applyAuthoritativeCloudHistory(
      [staleLocal],
      [currentSession, staleLocal],
      [remote],
    ).map((entry) => entry.id)).toEqual(["current-session", "remote"]);
  });

  it("uses isolated local keys and round-trips Supabase rows", () => {
    const entry = {
      ...createHistoryEntry({ query: "John 3:16", references: [reference], source: "manual" }),
      id: "00000000-0000-4000-8000-000000000003",
    };
    const remote = historyEntryToRemote(entry, "user-1");

    expect(getHistoryStorageKey()).toBe("scripture-listener-history");
    expect(getHistoryStorageKey("user-1")).toBe("scripture-listener-history:user-1");
    expect(remoteRowToHistoryEntry({
      ...remote,
      failed_searches: remote.failed_searches,
    })).toEqual(entry);
  });
});
