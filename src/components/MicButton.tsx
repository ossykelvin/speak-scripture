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
    <div className="relative flex items-center justify-center gap-4">
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
        >
          <Mic className="h-8 w-8" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: -10 }}
            className="absolute -right-14"
          >
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onStop}
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
