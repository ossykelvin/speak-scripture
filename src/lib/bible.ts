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

export type BibleProviderId = "helloao" | "legacy";

const HELLOAO_BIBLE_VERSIONS: { code: string; label: string }[] = [
  { code: "eng_kjv", label: "KJV - King James Version" },
  { code: "ENGWEBP", label: "WEB - World English Bible" },
  { code: "eng_asv", label: "ASV - American Standard Version" },
  { code: "eng_bbe", label: "BBE - Bible in Basic English" },
  { code: "eng_dby", label: "Darby Bible" },
  { code: "eng_ylt", label: "YLT - Young's Literal Translation" },
  { code: "BSB", label: "BSB - Berean Standard Bible" },
];

const LEGACY_BIBLE_VERSIONS: { code: string; label: string }[] = [
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

export function getBibleVersions(provider: BibleProviderId) {
  return provider === "helloao" ? HELLOAO_BIBLE_VERSIONS : LEGACY_BIBLE_VERSIONS;
}

export function getDefaultBibleTranslation(provider: BibleProviderId): string {
  return provider === "helloao" ? appConfig.defaultBibleTranslation : appConfig.legacyBibleTranslation;
}

export interface BibleResourceSummary {
  id: string;
  name: string;
  englishName: string;
  language: string;
  languageName?: string;
  shortName?: string;
  listOfBooksApiLink: string;
  availableFormats: string[];
}

export interface BibleResourceBook {
  id: string;
  name: string;
  commonName: string;
  numberOfChapters: number;
}

type ResourceKind = "translation" | "commentary" | "dataset";

export const DEFAULT_COMMENTARY_ID = "matthew-henry";

interface HelloAoBookResponse {
  books?: BibleResourceBook[];
}

interface HelloAoContentItem {
  type?: string;
  number?: number;
  content?: unknown[];
  text?: string;
}

interface HelloAoChapterResponse {
  chapter?: {
    content?: HelloAoContentItem[];
  };
}

interface HelloAoCommentaryChapterResponse extends HelloAoChapterResponse {
  commentary?: BibleResourceSummary;
}

const bookCache = new Map<string, Promise<BibleResourceBook[]>>();

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

async function fetchApiJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);
  try {
    const response = await fetch(`${appConfig.helloAoBibleApiBaseUrl}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Bible API request failed with status ${response.status}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAvailableBibleResources(kind: ResourceKind): Promise<BibleResourceSummary[]> {
  const routes = {
    translation: { path: "/api/available_translations.json", key: "translations" },
    commentary: { path: "/api/available_commentaries.json", key: "commentaries" },
    dataset: { path: "/api/available_datasets.json", key: "datasets" },
  } as const;
  const route = routes[kind];
  const data = await fetchApiJson<Record<string, BibleResourceSummary[]>>(route.path);
  return Array.isArray(data[route.key]) ? data[route.key] : [];
}

export async function fetchBibleResourceBooks(
  resourceId: string,
  kind: ResourceKind = "translation",
): Promise<BibleResourceBook[]> {
  const prefix = kind === "translation" ? "" : kind === "commentary" ? "/c" : "/d";
  const cacheKey = `${kind}:${resourceId}`;
  let request = bookCache.get(cacheKey);
  if (!request) {
    request = fetchApiJson<HelloAoBookResponse>(
      `/api${prefix}/${encodeURIComponent(resourceId)}/books.json`,
    ).then((data) => data.books ?? []);
    bookCache.set(cacheKey, request);
    request.catch(() => bookCache.delete(cacheKey));
  }
  return request;
}

function normalizeBookName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(contentToText).filter(Boolean).join(" ");
  if (content && typeof content === "object") {
    const item = content as HelloAoContentItem;
    if (typeof item.text === "string") return item.text;
    if (item.content) return contentToText(item.content);
  }
  return "";
}

function cleanScriptureText(value: string): string {
  return value.replace(/¶/g, "").replace(/\s+/g, " ").trim();
}

function cleanCommentaryText(value: string): string {
  return value
    .replace(/¶/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findResourceBook(books: BibleResourceBook[], bookName: string): BibleResourceBook | undefined {
  const requestedBook = normalizeBookName(bookName);
  return books.find((item) =>
    normalizeBookName(item.name) === requestedBook || normalizeBookName(item.commonName) === requestedBook,
  );
}

export async function fetchCommentaryText(
  ref: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd">,
  commentaryId = DEFAULT_COMMENTARY_ID,
): Promise<{ text: string; commentaryName: string; sourceVerse: number | null }> {
  try {
    const books = await fetchBibleResourceBooks(commentaryId, "commentary");
    const book = findResourceBook(books, ref.book);
    if (!book) throw new Error(`Book ${ref.book} is unavailable in ${commentaryId}`);

    const data = await fetchApiJson<HelloAoCommentaryChapterResponse>(
      `/api/c/${encodeURIComponent(commentaryId)}/${encodeURIComponent(book.id)}/${ref.chapter}.json`,
    );
    const commentaryItems = (data.chapter?.content ?? [])
      .filter((item) => item.type === "verse" && typeof item.number === "number")
      .sort((a, b) => a.number! - b.number!);
    const exactItem = commentaryItems.find((item) => item.number === ref.verseStart);
    const earlierItems = commentaryItems.filter((item) => item.number! <= ref.verseStart);
    const nearestItem = earlierItems[earlierItems.length - 1];
    const selectedItem = exactItem ?? nearestItem ?? commentaryItems[0];
    const text = selectedItem ? cleanCommentaryText(contentToText(selectedItem.content)) : "";

    if (!text) throw new Error("Bible commentary returned no text");

    return {
      text,
      commentaryName: data.commentary?.englishName ?? data.commentary?.name ?? commentaryId,
      sourceVerse: selectedItem?.number ?? null,
    };
  } catch (error) {
    console.error("Commentary lookup failed:", error);
    throw new Error("Commentary is temporarily unavailable");
  }
}

export async function fetchVerseText(
  ref: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd">,
  translation?: string,
  provider: BibleProviderId = "helloao",
): Promise<string> {
  const selectedTranslation = translation ?? getDefaultBibleTranslation(provider);
  try {
    if (provider === "legacy") {
      const verseRange = ref.verseEnd && ref.verseEnd > ref.verseStart
        ? `${ref.verseStart}-${ref.verseEnd}`
        : `${ref.verseStart}`;
      const query = `${ref.book}+${ref.chapter}:${verseRange}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);
      try {
        const response = await fetch(
          `${appConfig.legacyBibleApiBaseUrl}/${encodeURIComponent(query)}?translation=${encodeURIComponent(selectedTranslation)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Bible API request failed with status ${response.status}`);
        const data = await response.json() as { text?: string };
        if (!data.text?.trim()) throw new Error("Bible API returned no verse text");
        return data.text.trim();
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const books = await fetchBibleResourceBooks(selectedTranslation);
    const book = findResourceBook(books, ref.book);
    if (!book) throw new Error(`Book ${ref.book} is unavailable in ${selectedTranslation}`);

    const data = await fetchApiJson<HelloAoChapterResponse>(
      `/api/${encodeURIComponent(selectedTranslation)}/${encodeURIComponent(book.id)}/${ref.chapter}.json`,
    );
    const verseEnd = ref.verseEnd && ref.verseEnd > ref.verseStart ? ref.verseEnd : ref.verseStart;
    const text = (data.chapter?.content ?? [])
      .filter((item) => item.type === "verse" && typeof item.number === "number")
      .filter((item) => item.number! >= ref.verseStart && item.number! <= verseEnd)
      .map((item) => cleanScriptureText(contentToText(item.content)))
      .filter(Boolean)
      .join(" ");
    if (!text) throw new Error("Bible API returned no verse text");
    return text;
  } catch (error) {
    console.error("Verse lookup failed:", error);
    throw new Error("Verse text is temporarily unavailable");
  }
}
