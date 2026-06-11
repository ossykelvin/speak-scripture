import { motion } from "framer-motion";
import { BookOpen, X, GitCompare } from "lucide-react";
import { useState } from "react";
import { formatBibleReference, type BibleReference } from "@/lib/bible";
import { CompareDialog } from "./CompareDialog";

interface ReferenceCardProps {
  reference: BibleReference;
  index: number;
  onRemove: (id: string) => void;
}

export function ReferenceCard({ reference, index, onRemove }: ReferenceCardProps) {
  const [compareOpen, setCompareOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-lg p-4 relative group"
    >
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setCompareOpen(true)}
          aria-label="Compare translations"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <GitCompare className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(reference.id)}
          aria-label="Remove reference"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-1 p-2 rounded-md bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif text-sm font-semibold text-primary">
              {formatBibleReference(reference)}
            </h3>
            <span className="text-[10px] font-sans font-medium uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded">
              {reference.version}
            </span>
          </div>
          <p className="text-sm text-secondary-foreground leading-relaxed italic">
            {reference.verseText || "Loading..."}
          </p>
        </div>
      </div>
      <CompareDialog
        reference={reference}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </motion.div>
  );
}
