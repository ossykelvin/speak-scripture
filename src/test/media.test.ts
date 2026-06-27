import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "@/lib/history";
import { getMediaTrackPreview, getMediaTrackSpeech, getMediaTrackTitle } from "@/lib/media";

const entry: HistoryEntry = {
  id: "history-1",
  date: "2026-06-20T12:00:00.000Z",
  duration: 0,
  source: "manual",
  query: "What does John 3:16 say?",
  references: [{
    id: "reference-1",
    book: "John",
    chapter: 3,
    verseStart: 16,
    raw: "John 3:16",
    version: "WEB",
    verseText: "For God so loved the world.",
  }],
};

describe("history media tracks", () => {
  it("uses the Bible reference as the track title", () => {
    expect(getMediaTrackTitle(entry)).toBe("John 3:16");
  });

  it("uses the first available verse text as the preview", () => {
    expect(getMediaTrackPreview(entry)).toBe("For God so loved the world.");
  });

  it("reads only the reference and verse text", () => {
    const speech = getMediaTrackSpeech(entry);
    expect(speech).toBe("John 3:16. For God so loved the world.");
    expect(speech).not.toContain(entry.query);
  });

  it("announces searches without matches", () => {
    expect(getMediaTrackSpeech({ ...entry, references: [] })).toBe("No Bible reference was found.");
  });
});
