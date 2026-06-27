import { createContext } from "react";
import type { BibleProviderId } from "@/lib/bible";

export const BIBLE_PROVIDER_STORAGE_KEY = "speak-scripture-bible-provider";

export interface BibleProviderContextValue {
  provider: BibleProviderId;
  setProvider: (provider: BibleProviderId) => void;
}

export const BibleProviderContext = createContext<BibleProviderContextValue | null>(null);
