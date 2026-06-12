import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function MicButton({ isListening, onStart, onStop, disabled }: MicButtonProps) {
  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        {isListening && (
          <>
            <span className="absolute h-20 w-20 rounded-full bg-destructive/30 animate-pulse-ring" />
            <span className="absolute h-20 w-20 rounded-full bg-destructive/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
          </>
        )}

        <motion.div whileTap={{ scale: 0.92 }}>
          <Button
            variant={isListening ? "micActive" : "mic"}
            size="mic"
            onClick={isListening ? undefined : onStart}
            disabled={disabled || isListening}
            style={isListening ? {} : { animation: "gentle-glow 3s ease-in-out infinite" }}
            aria-label={isListening ? "Listening" : "Start listening"}
          >
            <Mic className="h-8 w-8" />
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: -10 }}
          >
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onStop}
              aria-label="Stop listening"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
