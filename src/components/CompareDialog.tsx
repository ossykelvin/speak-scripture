import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchVerseText, formatBibleReference, getBibleVersions, type BibleReference } from "@/lib/bible";
import { Loader2 } from "lucide-react";
import { useBibleProvider } from "@/hooks/use-bible-provider";

interface CompareDialogProps {
  reference: BibleReference;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompareDialog({ reference, open, onOpenChange }: CompareDialogProps) {
  const { provider } = useBibleProvider();
  const bibleVersions = getBibleVersions(provider);
  const currentCode = reference.version.toLowerCase();
  const defaultCompare =
    bibleVersions.find((v) => v.code.toLowerCase() !== currentCode)?.code ?? bibleVersions[0].code;
  const [compareVersion, setCompareVersion] = useState(defaultCompare);
  const [compareText, setCompareText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setCompareText("");
    fetchVerseText(reference, compareVersion, provider)
      .then((text) => {
        if (!cancelled) setCompareText(text);
      })
      .catch((error) => {
        if (!cancelled) {
          setCompareText(error instanceof Error ? error.message : "Verse text is unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, compareVersion, provider, reference]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{formatBibleReference(reference)}</DialogTitle>
          <DialogDescription>Compare this passage across translations.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card/50 p-3 space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded inline-block">
              {reference.version}
            </span>
            <p className="text-sm text-secondary-foreground leading-relaxed italic">
              {reference.verseText || "Verse text unavailable"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Compare with
            </label>
            <Select value={compareVersion} onValueChange={setCompareVersion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bibleVersions.filter((v) => v.code.toLowerCase() !== currentCode).map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border bg-card/50 p-3 space-y-1.5 min-h-[80px]">
            <span className="text-[10px] font-medium uppercase tracking-wider bg-accent/30 text-accent-foreground px-1.5 py-0.5 rounded inline-block">
              {compareVersion.toUpperCase()}
            </span>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading...
              </div>
            ) : (
              <p className="text-sm text-secondary-foreground leading-relaxed italic">
                {compareText}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
