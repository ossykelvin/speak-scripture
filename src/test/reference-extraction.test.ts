import { describe, expect, it } from "vitest";
import { extractBibleReferencesLocally } from "@/lib/reference-extraction";

describe("local Bible reference extraction", () => {
  it("extracts explicit references and ranges", () => {
    expect(extractBibleReferencesLocally("Read John 3:16 and Romans 8:28-30")).toMatchObject([
      { book: "John", chapter: 3, verseStart: 16, verseEnd: null },
      { book: "Romans", chapter: 8, verseStart: 28, verseEnd: 30 },
    ]);
  });

  it("recognizes the quote shown in the failed search", () => {
    expect(extractBibleReferencesLocally("I shall not want")).toMatchObject([
      { book: "Psalms", chapter: 23, verseStart: 1, verseEnd: null },
    ]);
  });

  it("recognizes short well-known quotes without waiting on remote detection", () => {
    expect(extractBibleReferencesLocally("Jesus wept")).toMatchObject([
      { book: "John", chapter: 11, verseStart: 35, verseEnd: null },
    ]);
  });

  it("does not invent a reference for unrelated text", () => {
    expect(extractBibleReferencesLocally("This is an ordinary sentence")).toEqual([]);
  });
});
