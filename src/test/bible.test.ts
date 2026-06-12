import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchVerseText, formatBibleReference, normalizeBibleReference } from "@/lib/bible";

describe("Bible reference normalization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("normalizes aliases, casing, whitespace, and ranges", () => {
    const reference = normalizeBibleReference({
      book: "  psalm ",
      chapter: 23,
      verseStart: 1,
      verseEnd: 4,
      raw: " the Lord is my shepherd ",
    });

    expect(reference).toEqual({
      book: "Psalms",
      chapter: 23,
      verseStart: 1,
      verseEnd: 4,
      raw: "the Lord is my shepherd",
    });
    expect(formatBibleReference(reference)).toBe("Psalms 23:1-4");
  });

  it("drops invalid reverse ranges", () => {
    const reference = normalizeBibleReference({
      book: "john",
      chapter: 3,
      verseStart: 16,
      verseEnd: 12,
      raw: "John 3:16",
    });

    expect(reference.verseEnd).toBeNull();
    expect(formatBibleReference(reference)).toBe("John 3:16");
  });

  it("aborts stalled verse requests instead of hanging indefinitely", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));

    const result = fetchVerseText({
      book: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
    });
    const assertion = expect(result).rejects.toThrow("temporarily unavailable");

    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });
});
