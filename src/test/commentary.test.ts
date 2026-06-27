import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCommentaryText } from "@/lib/bible";
import { getCommentaryTargets } from "@/lib/commentary";
import type { HistoryEntry } from "@/lib/history";

describe("commentary helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("flattens unique history scriptures into commentary targets", () => {
    const history = [
      {
        id: "entry-1",
        date: "2026-06-26T00:00:00.000Z",
        duration: 0,
        query: "Jesus wept",
        references: [
          {
            id: "ref-1",
            book: "John",
            chapter: 11,
            verseStart: 35,
            verseEnd: null,
            raw: "Jesus wept",
            version: "ENG_KJV",
            verseText: "Jesus wept.",
          },
        ],
      },
      {
        id: "entry-2",
        date: "2026-06-25T00:00:00.000Z",
        duration: 0,
        query: "John 11:35",
        references: [
          {
            id: "ref-2",
            book: "John",
            chapter: 11,
            verseStart: 35,
            verseEnd: null,
            raw: "John 11:35",
            version: "ENG_KJV",
          },
        ],
      },
    ] satisfies HistoryEntry[];

    expect(getCommentaryTargets(history)).toHaveLength(1);
    expect(getCommentaryTargets(history)[0]).toMatchObject({
      key: "john 11:35",
      query: "Jesus wept",
    });
  });

  it("fetches the nearest commentary section when the exact verse is not keyed", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ books: [{ id: "JHN", name: "John", commonName: "John", numberOfChapters: 21 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          commentary: { englishName: "Matthew Henry Bible Commentary" },
          chapter: {
            content: [
              { type: "verse", number: 33, content: ["Commentary for the Lazarus passage."] },
              { type: "verse", number: 45, content: ["Later section."] },
            ],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCommentaryText({
      book: "John",
      chapter: 11,
      verseStart: 35,
      verseEnd: null,
    })).resolves.toEqual({
      commentaryName: "Matthew Henry Bible Commentary",
      sourceVerse: 33,
      text: "Commentary for the Lazarus passage.",
    });
  });
});
