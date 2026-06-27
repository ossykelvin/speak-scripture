import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookMarked,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { HistoryEntry } from "@/lib/history";
import { getMediaTrackPreview, getMediaTrackSpeech, getMediaTrackTitle, selectNaturalEnglishVoice } from "@/lib/media";
import { cn } from "@/lib/utils";

type RepeatMode = "off" | "one" | "all";
const VOLUME_STORAGE_KEY = "speak-scripture-media-volume";

interface MediaPlayerProps {
  history: HistoryEntry[];
}

function getRandomIndex(length: number, currentIndex: number): number {
  if (length < 2) return 0;
  const candidate = Math.floor(Math.random() * (length - 1));
  return candidate >= currentIndex ? candidate + 1 : candidate;
}

export function MediaPlayer({ history }: MediaPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [volume, setVolume] = useState(() => {
    const stored = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
    return Number.isFinite(stored) && stored >= 0 && stored <= 1 ? stored : 1;
  });
  const generationRef = useRef(0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playTrackRef = useRef<(index: number) => void>(() => undefined);
  const historyRef = useRef(history);
  const currentIndexRef = useRef(currentIndex);
  const shuffleRef = useRef(shuffle);
  const repeatModeRef = useRef(repeatMode);
  const volumeRef = useRef(volume);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  historyRef.current = history;
  currentIndexRef.current = currentIndex;
  shuffleRef.current = shuffle;
  repeatModeRef.current = repeatMode;
  volumeRef.current = volume;

  const finishTrack = useCallback((finishedIndex: number) => {
    const queue = historyRef.current;
    if (repeatModeRef.current === "one") {
      playTrackRef.current(finishedIndex);
      return;
    }

    if (shuffleRef.current && queue.length > 1) {
      playTrackRef.current(getRandomIndex(queue.length, finishedIndex));
      return;
    }

    const hasNext = finishedIndex < queue.length - 1;
    if (hasNext || repeatModeRef.current === "all") {
      playTrackRef.current(hasNext ? finishedIndex + 1 : 0);
      return;
    }

    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const playTrack = useCallback((index: number) => {
    const entry = historyRef.current[index];
    if (!entry || !isSupported) return;

    generationRef.current += 1;
    const generation = generationRef.current;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(getMediaTrackSpeech(entry));
    const naturalVoice = selectNaturalEnglishVoice(voicesRef.current);
    utterance.voice = naturalVoice ?? null;
    utterance.lang = naturalVoice?.lang ?? "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = volumeRef.current;
    currentUtteranceRef.current = utterance;
    utterance.onend = () => {
      if (generation === generationRef.current) {
        currentUtteranceRef.current = null;
        finishTrack(index);
      }
    };
    utterance.onerror = (event) => {
      if (generation === generationRef.current && event.error !== "canceled" && event.error !== "interrupted") {
        currentUtteranceRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    setCurrentIndex(index);
    setIsPlaying(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  }, [finishTrack, isSupported]);

  playTrackRef.current = playTrack;

  const stopPlayback = useCallback(() => {
    generationRef.current += 1;
    window.speechSynthesis?.cancel();
    currentUtteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const togglePlayback = () => {
    if (!isPlaying) {
      playTrack(currentIndex);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const moveTrack = (direction: -1 | 1) => {
    if (history.length === 0) return;
    const nextIndex = shuffle
      ? getRandomIndex(history.length, currentIndex)
      : (currentIndex + direction + history.length) % history.length;
    playTrack(nextIndex);
  };

  const cycleRepeatMode = () => {
    setRepeatMode((mode) => mode === "off" ? "all" : mode === "all" ? "one" : "off");
  };

  const handleVolumeChange = ([nextVolume]: number[]) => {
    setVolume(nextVolume);
    if (currentUtteranceRef.current) currentUtteranceRef.current.volume = nextVolume;
  };

  useEffect(() => {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [isSupported]);

  useEffect(() => {
    if (currentIndex >= history.length) {
      stopPlayback();
      setCurrentIndex(Math.max(0, history.length - 1));
    }
  }, [currentIndex, history.length, stopPlayback]);

  useEffect(() => () => {
    generationRef.current += 1;
    window.speechSynthesis?.cancel();
  }, []);

  if (history.length === 0) {
    return (
      <div className="pt-10 text-center space-y-2">
        <ListMusic className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No tracks in your media queue</p>
        <p className="text-xs text-muted-foreground/60">Your completed searches will appear here automatically.</p>
      </div>
    );
  }

  const currentTrack = history[currentIndex] ?? history[0];

  return (
    <div className="space-y-4 pb-4">
      <section className="sticky top-0 z-10 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur" aria-label="Media controls">
        <div className="mb-4 flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Volume2 className={cn("h-5 w-5 text-primary", isPlaying && !isPaused && "animate-pulse")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Now playing</p>
            <p className="truncate text-sm font-semibold text-foreground">{getMediaTrackTitle(currentTrack)}</p>
            <p className="text-xs text-muted-foreground">Track {currentIndex + 1} of {history.length}</p>
          </div>
        </div>

        {!isSupported && (
          <p className="mb-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            Audio playback is unavailable in this browser.
          </p>
        )}

        <div className="flex items-center justify-center gap-2">
          <Button type="button" size="icon" variant="ghost" onClick={() => moveTrack(-1)} disabled={!isSupported} aria-label="Previous track">
            <SkipBack />
          </Button>
          <Button type="button" size="icon" variant="default" className="h-12 w-12 rounded-full" onClick={togglePlayback} disabled={!isSupported} aria-label={isPlaying && !isPaused ? "Pause" : "Play"}>
            {isPlaying && !isPaused ? <Pause /> : <Play />}
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={stopPlayback} disabled={!isSupported || !isPlaying} aria-label="Stop">
            <Square />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => moveTrack(1)} disabled={!isSupported} aria-label="Next track">
            <SkipForward />
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-3" aria-label="Volume control">
          {volume === 0 ? (
            <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : volume < 0.5 ? (
            <Volume1 className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={handleVolumeChange}
            aria-label="Media volume"
            className="flex-1"
          />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(volume * 100)}%
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" size="sm" variant={shuffle ? "secondary" : "ghost"} onClick={() => setShuffle((value) => !value)} aria-pressed={shuffle}>
            <Shuffle /> <span className="text-xs">Shuffle</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={repeatMode === "off" ? "ghost" : "secondary"}
            onClick={cycleRepeatMode}
            aria-label={`Loop: ${repeatMode === "off" ? "off" : repeatMode === "all" ? "all" : "one"}`}
            aria-pressed={repeatMode !== "off"}
          >
            {repeatMode === "one" ? <Repeat1 /> : <Repeat />}
            <span className="text-xs">
              {repeatMode === "off" ? "Loop off" : repeatMode === "all" ? "Loop all" : "Loop one"}
            </span>
          </Button>
        </div>
      </section>

      <section aria-label="Search history media queue">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">All searches</p>
          <p className="text-xs text-muted-foreground">{history.length} track{history.length === 1 ? "" : "s"}</p>
        </div>
        <ol className="space-y-2">
          {history.map((entry, index) => {
            const isCurrent = index === currentIndex;
            const preview = getMediaTrackPreview(entry);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => playTrack(index)}
                  disabled={!isSupported}
                  aria-label={`Play ${getMediaTrackTitle(entry)}`}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    isCurrent ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/30",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {isCurrent && isPlaying && !isPaused ? <Volume2 className="h-4 w-4 text-primary" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{getMediaTrackTitle(entry)}</span>
                    {preview && (
                      <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {preview}
                      </span>
                    )}
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <BookMarked className="h-3 w-3 text-primary" />
                      {entry.references.length} reference{entry.references.length === 1 ? "" : "s"}
                      <span aria-hidden="true">·</span>
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </span>
                  <Play className="h-4 w-4 shrink-0 text-primary" />
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
