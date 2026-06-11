import { describe, expect, it } from "vitest";
import { formatBibleReference, normalizeBibleReference } from "@/lib/bible";

describe("Bible reference normalization", () => {
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
});
