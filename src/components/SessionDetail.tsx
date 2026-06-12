import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReferenceCard } from "@/components/ReferenceCard";
import { type BibleReference } from "@/lib/bible";

interface HistoryEntry {
  id: string;
  date: string;
  duration: number;
  references: BibleReference[];
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

interface SessionDetailProps {
  entry: HistoryEntry;
  onBack: () => void;
}

export function SessionDetail({ entry, onBack }: SessionDetailProps) {
  const date = new Date(entry.date);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">Session Details</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="hidden w-px h-5 bg-border sm:block" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookMarked className="h-4 w-4 text-primary" />
          <span>{entry.references.length} ref{entry.references.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="hidden w-px h-5 bg-border sm:block" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{formatDuration(entry.duration)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1">
        {entry.references.length} reference{entry.references.length !== 1 ? "s" : ""}
      </p>

      <AnimatePresence>
        {entry.references.map((ref, i) => (
          <ReferenceCard key={ref.id} reference={ref} index={i} onRemove={() => {}} />
        ))}
      </AnimatePresence>

      {entry.references.length === 0 && (
        <p className="text-center text-muted-foreground text-sm pt-8">No references in this session</p>
      )}
    </motion.div>
  );
}

export type { HistoryEntry };
