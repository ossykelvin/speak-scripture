import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_COMMENTARY_ID,
  fetchAvailableBibleResources,
  fetchCommentaryText,
  formatBibleReference,
  type BibleResourceSummary,
} from "@/lib/bible";
import { getCommentaryTargets } from "@/lib/commentary";
import type { HistoryEntry } from "@/lib/history";

interface CommentaryMenuProps {
  history: HistoryEntry[];
}

interface CommentaryState {
  text: string;
  source: string;
  sourceVerse: number | null;
}

export function CommentaryMenu({ history }: CommentaryMenuProps) {
  const targets = useMemo(() => getCommentaryTargets(history), [history]);
  const [commentaries, setCommentaries] = useState<BibleResourceSummary[]>([]);
  const [selectedCommentary, setSelectedCommentary] = useState(DEFAULT_COMMENTARY_ID);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [commentaryByKey, setCommentaryByKey] = useState<Record<string, CommentaryState>>({});

  useEffect(() => {
    let ignore = false;
    fetchAvailableBibleResources("commentary")
      .then((resources) => {
        if (!ignore) setCommentaries(resources);
      })
      .catch(() => {
        if (!ignore) setCommentaries([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const selectedCommentaryName =
    commentaries.find((commentary) => commentary.id === selectedCommentary)?.englishName ?? "Matthew Henry Bible Commentary";

  const generateCommentary = async (targetKey: string) => {
    const target = targets.find((item) => item.key === targetKey);
    if (!target) return;

    const resultKey = `${selectedCommentary}:${target.key}`;
    setLoadingKey(resultKey);
    setErrorByKey((previous) => ({ ...previous, [resultKey]: "" }));

    try {
      const result = await fetchCommentaryText(target.reference, selectedCommentary);
      setCommentaryByKey((previous) => ({
        ...previous,
        [resultKey]: {
          text: result.text,
          source: result.commentaryName,
          sourceVerse: result.sourceVerse,
        },
      }));
    } catch (error) {
      setErrorByKey((previous) => ({
        ...previous,
        [resultKey]: error instanceof Error ? error.message : "Unable to generate commentary",
      }));
    } finally {
      setLoadingKey(null);
    }
  };

  if (targets.length === 0) {
    return (
      <div className="pt-10 text-center space-y-2">
        <BookOpenText className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No scriptures ready for commentary</p>
        <p className="text-xs text-muted-foreground/60">Search history with Bible references will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commentary source</p>
        <Select value={selectedCommentary} onValueChange={setSelectedCommentary}>
          <SelectTrigger className="mt-2" aria-label="Commentary source">
            <SelectValue placeholder={selectedCommentaryName} />
          </SelectTrigger>
          <SelectContent>
            {(commentaries.length > 0 ? commentaries : [{
              id: DEFAULT_COMMENTARY_ID,
              englishName: "Matthew Henry Bible Commentary",
              name: "Matthew Henry Bible Commentary",
            } as BibleResourceSummary]).map((commentary) => (
              <SelectItem key={commentary.id} value={commentary.id}>
                {commentary.englishName || commentary.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Generate study notes for scriptures already saved in your history.
        </p>
      </section>

      <section className="space-y-3" aria-label="History scripture commentary">
        {targets.map((target) => {
          const title = formatBibleReference(target.reference);
          const resultKey = `${selectedCommentary}:${target.key}`;
          const commentary = commentaryByKey[resultKey];
          const error = errorByKey[resultKey];
          const isLoading = loadingKey === resultKey;

          return (
            <article key={target.key} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-sm font-semibold text-foreground">{title}</h3>
                  {target.reference.verseText && (
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {target.reference.verseText}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void generateCommentary(target.key)}
                  disabled={isLoading}
                  aria-label={`Generate commentary for ${title}`}
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="text-xs">{commentary ? "Refresh" : "Generate"}</span>
                </Button>
              </div>

              {error && (
                <p className="mt-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              {commentary && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {commentary.source}
                    {commentary.sourceVerse ? ` · Section begins at verse ${commentary.sourceVerse}` : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {commentary.text}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
