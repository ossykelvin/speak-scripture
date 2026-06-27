import { useContext } from "react";
import { BibleProviderContext, type BibleProviderContextValue } from "@/lib/bible-provider-context";

export function useBibleProvider(): BibleProviderContextValue {
  const context = useContext(BibleProviderContext);
  if (!context) throw new Error("useBibleProvider must be used within BibleProvider");
  return context;
}
