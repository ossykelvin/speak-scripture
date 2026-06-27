import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export const KEEP_SIGNED_IN_STORAGE_KEY = "speak-scripture-keep-signed-in";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  keepSignedIn: boolean;
  setKeepSignedIn: (value: boolean) => void;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  keepSignedIn: true,
  setKeepSignedIn: () => undefined,
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [keepSignedIn, setKeepSignedInState] = useState(() =>
    localStorage.getItem(KEEP_SIGNED_IN_STORAGE_KEY) !== "false",
  );

  const setKeepSignedIn = (value: boolean) => {
    localStorage.setItem(KEEP_SIGNED_IN_STORAGE_KEY, String(value));
    setKeepSignedInState(value);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || keepSignedIn) return;

    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : Date.now();
    const delayMs = Math.max(0, expiresAtMs - Date.now());
    const timeoutId = window.setTimeout(() => {
      void supabase.auth.signOut();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [keepSignedIn, session]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ user, session, loading, signOut, keepSignedIn, setKeepSignedIn }}>
      {children}
    </AuthCtx.Provider>
  );
}
