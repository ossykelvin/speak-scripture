import { formatBibleReference } from "@/lib/bible";
import type { HistoryEntry } from "@/lib/history";

export function getMediaTrackPreview(entry: HistoryEntry): string {
  const firstVerse = entry.references.find((reference) => reference.verseText?.trim())?.verseText?.trim();
  return firstVerse ?? "";
}

export function getMediaTrackTitle(entry: HistoryEntry): string {
  if (entry.references.length > 0) {
    return entry.references.map(formatBibleReference).join(", ");
  }
  return "No Bible reference";
}

export function getMediaTrackSpeech(entry: HistoryEntry): string {
  const scripture = entry.references
    .map((reference) => {
      const label = formatBibleReference(reference);
      return reference.verseText?.trim() ? `${label}. ${reference.verseText.trim()}` : label;
    })
    .join(". ");

  return scripture || "No Bible reference was found.";
}

export function selectNaturalEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  return [...englishVoices].sort((first, second) => scoreVoice(second) - scoreVoice(first))[0];
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (/natural|neural|premium|enhanced/.test(name)) score += 100;
  if (/google|microsoft|samantha|daniel|karen/.test(name)) score += 30;
  if (/online/.test(name)) score += 10;
  if (voice.default) score += 5;
  return score;
}
