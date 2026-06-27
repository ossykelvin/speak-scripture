export interface ExtractedBibleReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  raw: string;
}

const BOOK_PATTERN = [
  "Song of Solomon", "Song of Songs", "1 Thessalonians", "2 Thessalonians",
  "1 Chronicles", "2 Chronicles", "1 Corinthians", "2 Corinthians",
  "Deuteronomy", "Ecclesiastes", "Lamentations", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Timothy", "2 Timothy", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Philippians", "Colossians", "Zephaniah",
  "Habakkuk", "Zechariah", "Nehemiah", "Leviticus", "Numbers", "Jeremiah",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Haggai", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "Galatians", "Ephesians", "Titus", "Philemon", "Hebrews", "James",
  "Jude", "Revelation", "Genesis", "Exodus", "Joshua", "Judges", "Ruth", "Ezra",
  "Esther", "Job", "Psalms?", "Proverbs", "Isaiah",
].join("|");

const EXPLICIT_REFERENCE = new RegExp(
  `\\b(${BOOK_PATTERN})\\s+(\\d{1,3}):(\\d{1,3})(?:\\s*[-\\u2013\\u2014]\\s*(\\d{1,3}))?\\b`,
  "gi",
);

const WELL_KNOWN_QUOTES: Array<{
  phrases: string[];
  book: string;
  chapter: number;
  verseStart: number;
}> = [
  { phrases: ["the lord is my shepherd", "i shall not want"], book: "Psalms", chapter: 23, verseStart: 1 },
  { phrases: ["for god so loved the world"], book: "John", chapter: 3, verseStart: 16 },
  { phrases: ["jesus wept"], book: "John", chapter: 11, verseStart: 35 },
  { phrases: ["i can do all things through christ"], book: "Philippians", chapter: 4, verseStart: 13 },
  { phrases: ["all things work together for good"], book: "Romans", chapter: 8, verseStart: 28 },
  { phrases: ["faith is the substance of things hoped for"], book: "Hebrews", chapter: 11, verseStart: 1 },
  { phrases: ["be still and know that i am god"], book: "Psalms", chapter: 46, verseStart: 10 },
  { phrases: ["no weapon formed against", "no weapon that is formed against"], book: "Isaiah", chapter: 54, verseStart: 17 },
  { phrases: ["do this in remembrance of me"], book: "Luke", chapter: 22, verseStart: 19 },
  { phrases: ["trust in the lord with all your heart", "lean not on your own understanding"], book: "Proverbs", chapter: 3, verseStart: 5 },
];

function referenceKey(reference: ExtractedBibleReference): string {
  return `${reference.book}:${reference.chapter}:${reference.verseStart}:${reference.verseEnd ?? ""}`.toLowerCase();
}

export function extractBibleReferencesLocally(text: string): ExtractedBibleReference[] {
  const references = new Map<string, ExtractedBibleReference>();

  for (const match of text.matchAll(EXPLICIT_REFERENCE)) {
    const verseStart = Number(match[3]);
    const possibleEnd = match[4] ? Number(match[4]) : null;
    const reference: ExtractedBibleReference = {
      book: match[1],
      chapter: Number(match[2]),
      verseStart,
      verseEnd: possibleEnd && possibleEnd > verseStart ? possibleEnd : null,
      raw: match[0],
    };
    references.set(referenceKey(reference), reference);
  }

  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  for (const known of WELL_KNOWN_QUOTES) {
    const phrase = known.phrases.find((candidate) => normalizedText.includes(candidate));
    if (!phrase) continue;
    const reference: ExtractedBibleReference = {
      book: known.book,
      chapter: known.chapter,
      verseStart: known.verseStart,
      verseEnd: null,
      raw: phrase,
    };
    references.set(referenceKey(reference), reference);
  }

  return [...references.values()];
}
