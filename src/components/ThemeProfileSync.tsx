import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { scripture } from "@/integrations/supabase/client";
import { isTheme } from "@/lib/themes";

export function ThemeProfileSync() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const hydratedUserIdRef = useRef<string | null>(null);
  const syncedThemeRef = useRef<string | null>(null);
  const themeRef = useRef(theme);

  themeRef.current = theme;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      hydratedUserIdRef.current = null;
      syncedThemeRef.current = null;
      return;
    }

    let ignore = false;
    hydratedUserIdRef.current = null;
    syncedThemeRef.current = null;

    scripture
      .from("profiles")
      .select("selected_theme")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (ignore) return;

        if (error) {
          console.warn("Unable to load profile theme preference.", error);
          return;
        }

        const remoteTheme = data?.selected_theme;
        if (isTheme(remoteTheme)) {
          syncedThemeRef.current = remoteTheme;
          hydratedUserIdRef.current = user.id;
          if (remoteTheme !== themeRef.current) setTheme(remoteTheme);
          return;
        }

        const currentTheme = themeRef.current;
        syncedThemeRef.current = currentTheme;
        hydratedUserIdRef.current = user.id;
        await scripture
          .from("profiles")
          .upsert(
            { user_id: user.id, selected_theme: currentTheme },
            { onConflict: "user_id" },
          );
      });

    return () => {
      ignore = true;
    };
  }, [loading, setTheme, user]);

  useEffect(() => {
    if (!user || hydratedUserIdRef.current !== user.id || syncedThemeRef.current === theme) return;

    syncedThemeRef.current = theme;
    void scripture
      .from("profiles")
      .upsert(
        { user_id: user.id, selected_theme: theme },
        { onConflict: "user_id" },
      );
  }, [theme, user]);

  return null;
}
