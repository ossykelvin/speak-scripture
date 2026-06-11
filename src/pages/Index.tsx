import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  BookMarked,
  BookOpen,
  ChevronRight,
  Clock,
  Info,
  Moon,
  Search,
  Sun,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { MicButton } from "@/components/MicButton";
import { ReferenceCard } from "@/components/ReferenceCard";
import { fetchVerseText, normalizeBibleReference, type BibleReference } from "@/lib/bible";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SessionDetail } from "@/components/SessionDetail";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import { useTheme } from "@/hooks/use-theme";
import { appConfig } from "@/config";

interface SessionSummary {
  duration: number;
  referencesFound: number;
  failedSearches: number;
}

type ExtractedReference = Pick<
  BibleReference,
  "book" | "chapter" | "verseStart" | "verseEnd" | "raw"
>;

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
};

const referenceKey = (reference: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd">) =>
  `${reference.book}:${reference.chapter}:${reference.verseStart}:${reference.verseEnd ?? ""}`.toLowerCase();

const Index = () => {
  const [references, setReferences] = useState<BibleReference[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [selectedSession, setSelectedSession] = useState<HistoryEntry | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const listenStartRef = useRef<number | null>(null);
  const refsFoundThisSession = useRef(0);
  const failedSearchesThisSession = useRef(0);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const processText = useCallback(async (text: string, source: "microphone" | "manual") => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setTranscript(cleanText);
    setLookupMessage(null);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(appConfig.referenceFunctionName, {
        body: { text: cleanText },
      });
      if (error) throw error;

      const extracted = Array.isArray(data?.references)
        ? data.references as ExtractedReference[]
        : [];
      const uniqueReferences = new Map<string, BibleReference>();

      for (const rawReference of extracted) {
        const normalized = normalizeBibleReference(rawReference);
        const reference: BibleReference = {
          ...normalized,
          version: appConfig.defaultBibleTranslation.toUpperCase(),
          id: crypto.randomUUID(),
        };
        uniqueReferences.set(referenceKey(reference), reference);
      }

      const completeReferences = await Promise.all(
        [...uniqueReferences.values()].map(async (reference) => {
          try {
            return { ...reference, verseText: await fetchVerseText(reference) };
          } catch (verseError) {
            return {
              ...reference,
              verseText: verseError instanceof Error ? verseError.message : "Verse text is unavailable",
            };
          }
        }),
      );

      if (completeReferences.length === 0) {
        setLookupMessage("No scripture reference was found. Try including a book, chapter, and verse.");
        if (source === "microphone") {
          failedSearchesThisSession.current += 1;
        } else {
          setHistory((previous) => [{
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            duration: 0,
            references: [],
            failedSearches: 1,
            source,
          }, ...previous]);
        }
        return;
      }

      setReferences((previous) => {
        const existingKeys = new Set(previous.map(referenceKey));
        const newItems = completeReferences.filter((reference) => !existingKeys.has(referenceKey(reference)));
        return [...newItems, ...previous];
      });

      if (source === "microphone") {
        refsFoundThisSession.current += completeReferences.length;
      } else {
        setHistory((previous) => [{
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          duration: 0,
          references: completeReferences,
          failedSearches: 0,
          source,
        }, ...previous]);
        setManualText("");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process this text";
      setLookupMessage("Scripture detection is temporarily unavailable. Please try again.");
      toast({ title: "Scripture lookup failed", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const {
    isListening,
    isSupported,
    error: speechError,
    start,
    stop,
    clearError,
  } = useSpeechRecognition({
    onTranscript: (text) => {
      void processText(text, "microphone");
    },
  });

  const stopAndSummarize = useCallback(() => {
    stop();
    const elapsed = listenStartRef.current
      ? Math.round((Date.now() - listenStartRef.current) / 1000)
      : 0;
    const sessionSummary = {
      duration: elapsed,
      referencesFound: refsFoundThisSession.current,
      failedSearches: failedSearchesThisSession.current,
    };
    setSummary(sessionSummary);

    setReferences((currentReferences) => {
      if (currentReferences.length > 0 || sessionSummary.failedSearches > 0) {
        setHistory((previous) => [{
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          duration: elapsed,
          references: [...currentReferences],
          failedSearches: sessionSummary.failedSearches,
          source: "microphone",
        }, ...previous]);
      }
      return currentReferences;
    });

    listenStartRef.current = null;
  }, [stop]);

  const handleStart = () => {
    setReferences([]);
    setSummary(null);
    setTranscript("");
    setLookupMessage(null);
    clearError();
    refsFoundThisSession.current = 0;
    failedSearchesThisSession.current = 0;
    listenStartRef.current = Date.now();
    start();
  };

  const clearAll = () => {
    setReferences([]);
    setSummary(null);
    setLookupMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col max-w-lg mx-auto">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-serif text-lg font-semibold text-foreground tracking-wide">
            {appConfig.appName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {references.length > 0 && (
            <button onClick={clearAll} aria-label="Clear references" className="text-muted-foreground hover:text-foreground">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={toggleTheme} aria-label="Toggle theme" className="text-muted-foreground hover:text-foreground">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button onClick={() => navigate("/profile")} aria-label="Profile" className="text-muted-foreground hover:text-foreground">
            <UserCircle className="h-4 w-4" />
          </button>
          {appConfig.analyticsEnabled && (
            <button onClick={() => navigate("/analytics")} aria-label="Analytics" className="text-muted-foreground hover:text-foreground">
              <BarChart3 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => navigate("/about")} aria-label="About" className="text-muted-foreground hover:text-foreground">
            <Info className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center py-6 px-4 gap-4">
        {isSupported ? (
          <>
            <MicButton isListening={isListening} onStart={handleStart} onStop={stopAndSummarize} disabled={isProcessing} />
            <motion.p className="text-sm text-muted-foreground text-center" animate={{ opacity: isListening ? 1 : 0.7 }}>
              {isListening
                ? isProcessing ? "Extracting references..." : "Listening to discussion..."
                : "Tap to start listening"}
            </motion.p>
          </>
        ) : (
          <div className="w-full rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            Speech recognition is unavailable in this browser. Use Chrome or Edge, or enter text below.
          </div>
        )}

        {speechError && (
          <div className="flex w-full gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{speechError}</span>
          </div>
        )}

        <form
          className="w-full space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void processText(manualText, "manual");
          }}
        >
          <Textarea
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            placeholder={'Type a reference or quote, for example "John 3:16"'}
            rows={3}
            aria-label="Scripture text"
          />
          <Button type="submit" variant="outline" className="w-full" disabled={isProcessing || !manualText.trim()}>
            <Search className="h-4 w-4 mr-2" />
            {isProcessing ? "Searching..." : "Find Scripture"}
          </Button>
        </form>

        {transcript && isListening && (
          <p className="text-xs text-muted-foreground/70 text-center px-6 max-h-12 overflow-hidden line-clamp-2">
            "{transcript}"
          </p>
        )}
        {lookupMessage && (
          <p className="w-full rounded-lg border border-border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
            {lookupMessage}
          </p>
        )}
      </div>

      <AnimatePresence>
        {summary && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mb-4 rounded-lg border border-border bg-card/60 p-4 flex flex-wrap items-center gap-4"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" /> {formatDuration(summary.duration)}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookMarked className="h-4 w-4 text-primary" /> {summary.referencesFound} found
            </span>
            {summary.failedSearches > 0 && (
              <span className="text-sm text-muted-foreground">{summary.failedSearches} without a match</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="live" className="flex-1 flex flex-col px-4 pb-8">
        <TabsList className="w-full">
          <TabsTrigger value="live" className="flex-1">Live</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="flex-1 space-y-3 overflow-y-auto mt-3">
          {references.length === 0 ? (
            <div className="text-center pt-10 space-y-2">
              <p className="text-muted-foreground text-sm">No references detected yet</p>
              <p className="text-muted-foreground/60 text-xs">Listen to a discussion or search with text.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1">
                {references.length} reference{references.length !== 1 ? "s" : ""} found
              </p>
              <AnimatePresence>
                {references.map((reference, index) => (
                  <ReferenceCard
                    key={reference.id}
                    reference={reference}
                    index={index}
                    onRemove={(id) => setReferences((previous) => previous.filter((item) => item.id !== id))}
                  />
                ))}
              </AnimatePresence>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 space-y-3 overflow-y-auto mt-3">
          <AnimatePresence mode="wait">
            {selectedSession ? (
              <SessionDetail key="detail" entry={selectedSession} onBack={() => setSelectedSession(null)} />
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center pt-10 space-y-2">
                    <p className="text-muted-foreground text-sm">No search history yet</p>
                    <p className="text-muted-foreground/60 text-xs">Completed searches will appear here.</p>
                  </div>
                ) : history.map((entry) => {
                  const date = new Date(entry.date);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedSession(entry)}
                      className="w-full text-left bg-card border border-border rounded-lg p-4 space-y-3 hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BookMarked className="h-3 w-3 text-primary" /> {entry.references.length}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      {entry.references.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.references.map((reference) => (
                            <span key={reference.id} className="text-[11px] font-serif bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {reference.book} {reference.chapter}:{reference.verseStart}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No reference matched this search.</p>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
