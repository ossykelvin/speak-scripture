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
  clearGuestHistory,
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
    const guestHistory = loadHistory();
    const initialHistory = mergeHistory(localUserHistory, guestHistory);
    replaceHistory(initialHistory, userId);
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
      const merged = mergeHistory(historyRef.current, remoteHistory);
      replaceHistory(merged, userId);

      if (merged.length > 0) {
        const { error: upsertError } = await supabase
          .from("search_history")
          .upsert(merged.map((entry) => historyEntryToRemote(entry, userId)), { onConflict: "id" });

        if (cancelled) return;
        if (upsertError) {
          setSyncError("Some local progress could not be uploaded. It will remain available on this device.");
          setSyncing(false);
          return;
        }
      }

      clearGuestHistory();
      setSyncing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, replaceHistory, user?.id]);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    const userId = activeUserRef.current;
    setHistory((previous) => {
      const next = mergeHistory([entry], previous);
      historyRef.current = next;
      saveHistory(next, userId);
      return next;
    });

    if (!userId) return;
    void supabase
      .from("search_history")
      .upsert(historyEntryToRemote(entry, userId), { onConflict: "id" })
      .then(({ error }) => {
        if (error) {
          setSyncError("This search is saved locally and will sync when cloud storage is available.");
        } else {
          setSyncError(null);
        }
      });
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addHistoryEntry, syncing, syncError }}>
      {children}
    </HistoryContext.Provider>
  );
}
