import { appConfig } from "@/config";

export interface BibleReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number | null;
  raw: string;
  verseText?: string;
  version: string;
  id: string;
}

export const BIBLE_VERSIONS: { code: string; label: string }[] = [
  { code: "kjv", label: "KJV - King James Version" },
  { code: "web", label: "WEB - World English Bible" },
  { code: "asv", label: "ASV - American Standard Version" },
  { code: "bbe", label: "BBE - Bible in Basic English" },
  { code: "darby", label: "Darby Bible" },
  { code: "ylt", label: "YLT - Young's Literal Translation" },
  { code: "oeb-cw", label: "OEB - Open English Bible (CW)" },
  { code: "oeb-us", label: "OEB - Open English Bible (US)" },
  { code: "almeida", label: "Almeida (Portuguese)" },
  { code: "rccv", label: "RCCV (Romanian)" },
];

const BOOK_ALIASES: Record<string, string> = {
  psalm: "Psalms",
  psalms: "Psalms",
  songofsolomon: "Song of Solomon",
  songofsongs: "Song of Solomon",
  revelation: "Revelation",
  revelations: "Revelation",
};

export function normalizeBibleReference(
  reference: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd" | "raw">,
): Omit<BibleReference, "id" | "version" | "verseText"> {
  const compactBook = reference.book.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliasedBook = BOOK_ALIASES[compactBook];
  const book = aliasedBook ?? reference.book
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const chapter = Math.max(1, Math.trunc(Number(reference.chapter)));
  const verseStart = Math.max(1, Math.trunc(Number(reference.verseStart)));
  const rawVerseEnd = reference.verseEnd == null ? null : Math.trunc(Number(reference.verseEnd));
  const verseEnd = rawVerseEnd && rawVerseEnd > verseStart ? rawVerseEnd : null;

  return { book, chapter, verseStart, verseEnd, raw: reference.raw.trim() };
}

export function formatBibleReference(ref: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd">) {
  const hasRange = typeof ref.verseEnd === "number" && ref.verseEnd > ref.verseStart;
  const verseRange = hasRange ? `${ref.verseStart}-${ref.verseEnd}` : `${ref.verseStart}`;
  return `${ref.book} ${ref.chapter}:${verseRange}`;
}

export async function fetchVerseText(
  ref: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd">,
  translation: string = appConfig.defaultBibleTranslation,
): Promise<string> {
  const verseRange = ref.verseEnd && ref.verseEnd > ref.verseStart
    ? `${ref.verseStart}-${ref.verseEnd}`
    : `${ref.verseStart}`;
  const query = `${ref.book}+${ref.chapter}:${verseRange}`;

  try {
    const response = await fetch(
      `${appConfig.bibleApiBaseUrl}/${encodeURIComponent(query)}?translation=${encodeURIComponent(translation)}`,
    );
    if (!response.ok) throw new Error(`Bible API request failed with status ${response.status}`);

    const data = await response.json();
    if (!data.text?.trim()) throw new Error("Bible API returned no verse text");
    return data.text.trim();
  } catch (error) {
    console.error("Verse lookup failed:", error);
    throw new Error("Verse text is temporarily unavailable");
  }
}
