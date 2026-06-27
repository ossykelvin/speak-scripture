import { useEffect, useState, type ReactNode } from "react";
import type { BibleProviderId } from "@/lib/bible";
import { BIBLE_PROVIDER_STORAGE_KEY, BibleProviderContext } from "@/lib/bible-provider-context";

export function BibleProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BibleProviderId>(() => {
    const stored = localStorage.getItem(BIBLE_PROVIDER_STORAGE_KEY);
    return stored === "legacy" ? "legacy" : "helloao";
  });

  useEffect(() => {
    localStorage.setItem(BIBLE_PROVIDER_STORAGE_KEY, provider);
  }, [provider]);

  return (
    <BibleProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </BibleProviderContext.Provider>
  );
}
