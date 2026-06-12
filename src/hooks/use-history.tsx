import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  HISTORY_SYNC_LIMIT,
  applyAuthoritativeCloudHistory,
  historyEntryToRemote,
  loadHistory,
  mergeHistory,
  remoteRowToHistoryEntry,
  saveHistory,
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
  return supabase.from("profiles").upsert({
    user_id: userId,
    history_entry_count: entryCount,
    last_history_sync_at: syncedAt,
  }, { onConflict: "user_id" });
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const activeUserRef = useRef<string | null>(null);
  const historyRef = useRef(history);

  const replaceHistory = useCallback((entries: HistoryEntry[], userId?: string | null) => {
    historyRef.current = entries;
    setHistory(entries);
    saveHistory(entries, userId);
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
      const { data, error } = await supabase
        .from("search_history")
        .select("id, searched_at, duration, scripture_references, failed_searches, source, query")
        .eq("user_id", userId)
        .order("searched_at", { ascending: false })
        .limit(HISTORY_SYNC_LIMIT);

      if (cancelled) return;
      if (error) {
        setSyncError("Cloud progress is temporarily unavailable. Local progress is still being saved.");
        setSyncing(false);
        return;
      }

      const remoteHistory = (data as RemoteHistoryRow[]).map(remoteRowToHistoryEntry);
      const authoritativeHistory = applyAuthoritativeCloudHistory(
        localUserHistory,
        historyRef.current,
        remoteHistory,
      );
      replaceHistory(authoritativeHistory, userId);

      const { error: profileSyncError } = await recordProfileHistorySync(
        userId,
        authoritativeHistory.length,
      );

      if (cancelled) return;
      if (profileSyncError) {
        setSyncError("History was uploaded, but the profile sync status could not be updated.");
        setSyncing(false);
        return;
      }

      setSyncing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, replaceHistory, user?.id]);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    const userId = activeUserRef.current;
    const next = mergeHistory([entry], historyRef.current);
    historyRef.current = next;
    setHistory(next);
    saveHistory(next, userId);

    if (!userId) return;
    void supabase
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
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addHistoryEntry, syncing, syncError }}>
      {children}
    </HistoryContext.Provider>
  );
}
