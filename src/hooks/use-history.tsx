import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { scripture, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { appConfig } from "@/config";
import {
  HISTORY_SYNC_LIMIT,
  applyAuthoritativeCloudHistory,
  historyEntryToRemote,
  loadHistory,
  mergeHistory,
  remoteRowToHistoryEntry,
  saveHistory,
  scriptureHistoryOnly,
  type HistoryEntry,
  type RemoteHistoryRow,
} from "@/lib/history";

interface HistoryContextValue {
  history: HistoryEntry[];
  addHistoryEntry: (entry: HistoryEntry) => void;
  syncing: boolean;
  syncError: string | null;
}

const HistoryContext = createContext<HistoryContextValue>({
  history: [],
  addHistoryEntry: () => undefined,
  syncing: false,
  syncError: null,
});

export const useHistory = () => useContext(HistoryContext);

async function recordProfileHistorySync(
  userId: string,
  entryCount: number,
) {
  const syncedAt = new Date().toISOString();
  return scripture.from("profiles").upsert({
    user_id: userId,
    history_entry_count: entryCount,
    last_history_sync_at: syncedAt,
  }, { onConflict: "user_id" });
}

async function fetchRemoteHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await scripture
    .from("search_history")
    .select("id, searched_at, duration, scripture_references, failed_searches, source, query")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(HISTORY_SYNC_LIMIT);

  if (error) throw error;
  return scriptureHistoryOnly((data as RemoteHistoryRow[]).map(remoteRowToHistoryEntry));
}

async function syncHistoryEntries(userId: string, entries: HistoryEntry[]) {
  const scriptureEntries = scriptureHistoryOnly(entries);
  if (scriptureEntries.length === 0) return;

  const payload = scriptureEntries.map((entry) => {
    const remoteEntry = historyEntryToRemote(entry, userId);
    return {
      id: remoteEntry.id,
      searched_at: remoteEntry.searched_at,
      duration: remoteEntry.duration,
      scripture_references: remoteEntry.scripture_references,
      failed_searches: remoteEntry.failed_searches,
      source: remoteEntry.source,
      query: remoteEntry.query,
    };
  });

  const { error } = await supabase.functions.invoke(appConfig.historySyncFunctionName, {
    body: { entries: payload },
  });
  if (error) throw error;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const activeUserRef = useRef<string | null>(null);
  const historyRef = useRef(history);

  const replaceHistory = useCallback((entries: HistoryEntry[], userId?: string | null) => {
    const scriptureEntries = scriptureHistoryOnly(entries);
    historyRef.current = scriptureEntries;
    setHistory(scriptureEntries);
    saveHistory(scriptureEntries, userId);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id ?? null;
    activeUserRef.current = userId;

    if (!userId) {
      replaceHistory(loadHistory());
      setSyncing(false);
      setSyncError(null);
      return;
    }

    let cancelled = false;
    const localUserHistory = loadHistory(userId);
    replaceHistory(localUserHistory, userId);
    setSyncing(true);
    setSyncError(null);

    void (async () => {
      try {
        const remoteHistory = await fetchRemoteHistory(userId);
        if (cancelled) return;

        const authoritativeHistory = applyAuthoritativeCloudHistory(
          localUserHistory,
          historyRef.current,
          remoteHistory,
        );
        replaceHistory(authoritativeHistory, userId);

        if (authoritativeHistory.length > 0) {
          await syncHistoryEntries(userId, authoritativeHistory);
        } else {
          const { error: profileSyncError } = await recordProfileHistorySync(userId, 0);
          if (profileSyncError) throw profileSyncError;
        }

        if (cancelled) return;
        setSyncing(false);
      } catch {
        if (cancelled) return;
        setSyncError("Cloud progress is temporarily unavailable. Local progress is still being saved.");
        setSyncing(false);
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, replaceHistory, user?.id]);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (!userId) return;

    let cancelled = false;
    const refreshFromCloud = async () => {
      try {
        const remoteHistory = await fetchRemoteHistory(userId);
        if (cancelled) return;
        const next = mergeHistory(remoteHistory, historyRef.current);
        replaceHistory(next, userId);
        setSyncError(null);
      } catch (error) {
        console.warn("Background history refresh failed.", error);
        if (!cancelled) {
          setSyncError(null);
        }
      }
    };

    const channel = supabase
      .channel(`search-history:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "scripture",
          table: "search_history",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refreshFromCloud();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [replaceHistory, user?.id]);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    if (entry.references.length === 0) return;

    const userId = activeUserRef.current;
    const next = mergeHistory([entry], historyRef.current);
    historyRef.current = next;
    setHistory(next);
    saveHistory(next, userId);

    if (!userId) return;
    void syncHistoryEntries(userId, [entry])
      .then(() => {
        setSyncError(null);
      })
      .catch(() => {
        void scripture
          .from("search_history")
          .upsert(historyEntryToRemote(entry, userId), { onConflict: "id" })
          .then(async ({ error }) => {
            if (error) {
              setSyncError("This search is saved on this device, but the online profile was not updated.");
              return;
            }

            const { error: profileSyncError } = await recordProfileHistorySync(userId, next.length);
            setSyncError(profileSyncError
              ? "This search was uploaded, but the profile sync status could not be updated."
              : null);
          });
        if (activeUserRef.current === userId) {
          setSyncError("This search is saved on this device, but the online profile was not updated.");
        }
      });
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addHistoryEntry, syncing, syncError }}>
      {children}
    </HistoryContext.Provider>
  );
}
