import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAvailableBibleResources,
  fetchVerseText,
  formatBibleReference,
  normalizeBibleReference,
} from "@/lib/bible";

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

  it("resolves HelloAO book IDs and extracts the requested verse range", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ books: [{ id: "JHN", name: "John", commonName: "John", numberOfChapters: 21 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chapter: {
            content: [
              { type: "verse", number: 15, content: ["Verse fifteen"] },
              { type: "verse", number: 16, content: [{ text: "¶ For God so loved the world." }] },
              { type: "verse", number: 17, content: ["For God sent not his Son."] },
            ],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const text = await fetchVerseText({
      book: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: 17,
    }, "test_translation");

    expect(text).toBe("For God so loved the world. For God sent not his Son.");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/test_translation/books.json");
    expect(fetchMock.mock.calls[1][0]).toContain("/api/test_translation/JHN/3.json");
  });

  it("loads the HelloAO resource catalogs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ id: "eng_kjv", name: "KJV" }] }),
    }));

    const resources = await fetchAvailableBibleResources("translation");
    expect(resources).toEqual([{ id: "eng_kjv", name: "KJV" }]);
  });

  it("uses the previous provider request format when selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "For God so loved the world." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const text = await fetchVerseText({
      book: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
    }, "kjv", "legacy");

    expect(text).toBe("For God so loved the world.");
    expect(fetchMock.mock.calls[0][0]).toContain("bible-api.com/John%2B3%3A16?translation=kjv");
  });
});
