import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookMarked, BookOpen, CheckCircle2, ExternalLink, LibraryBig, LogOut } from "lucide-react";
import { scripture } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBadges, getCurrentTitle } from "@/lib/badges";
import { useToast } from "@/components/ui/use-toast";
import { useHistory } from "@/hooks/use-history";
import { useBibleProvider } from "@/hooks/use-bible-provider";
import { useTheme } from "@/hooks/use-theme";
import type { BibleProviderId } from "@/lib/bible";
import { scriptureHistoryOnly } from "@/lib/history";
import { themeOptions, type Theme } from "@/lib/themes";

const PROVIDERS: Array<{
  id: BibleProviderId;
  title: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  {
    id: "helloao",
    title: "HelloAO",
    description: "More translations and access to commentaries and Bible datasets.",
    icon: LibraryBig,
  },
  {
    id: "legacy",
    title: "Bible API",
    description: "The original Bible API used by Speak Scripture.",
    icon: BookOpen,
  },
];

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const { provider, setProvider } = useBibleProvider();
  const { theme, setTheme } = useTheme();

  const { history, syncing, syncError } = useHistory();
  const successfulSearches = scriptureHistoryOnly(history);
  const totalRefs = successfulSearches.reduce((sum, e) => sum + e.references.length, 0);
  const badges = getBadges(totalRefs);
  const currentTitle = getCurrentTitle(totalRefs);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      scripture
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.display_name) setDisplayName(data.display_name);
        });
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await scripture
      .from("profiles")
      .upsert(
        { user_id: user.id, display_name: displayName, selected_theme: theme },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated." });
    }
  };

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
    if (!user) return;

    void scripture
      .from("profiles")
      .upsert(
        { user_id: user.id, selected_theme: value },
        { onConflict: "user_id" },
      )
      .then(({ error }) => {
        if (error) {
          toast({
            title: "Theme not synced",
            description: "This device changed theme, but your profile preference was not updated.",
            variant: "destructive",
          });
        }
      });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="app-shell flex min-h-screen w-full min-w-0 max-w-lg flex-col mx-auto px-4 py-6 sm:px-5">
      <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Avatar & Title */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <Avatar className="h-20 w-20 border-2 border-primary">
          <AvatarFallback className="text-xl font-serif bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-serif text-lg font-semibold text-foreground">{displayName || "User"}</p>
          <p className="text-sm text-primary font-medium">{currentTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {successfulSearches.length} successful searches · {totalRefs} references found
          </p>
          <p className={`mt-1 text-[11px] ${syncError ? "text-destructive" : "text-muted-foreground"}`}>
            {syncError ?? (syncing ? "Syncing progress..." : "Progress saved locally and to your profile")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="flex flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5 flex flex-1 flex-col">
          <section className="mb-8 space-y-4 rounded-xl border border-border bg-card p-4" aria-label="Edit profile">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-theme">Theme</Label>
              <Select value={theme} onValueChange={(value) => handleThemeChange(value as Theme)}>
                <SelectTrigger id="profile-theme" aria-label="Profile theme">
                  <SelectValue placeholder="Choose theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Signed-in users keep this theme across devices.
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? "..." : "Save"}
              </Button>
            </div>
          </section>

          <div className="mb-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xl font-semibold">{successfulSearches.length}</p>
              <p className="text-[10px] text-muted-foreground">Successful searches</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <BookMarked className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xl font-semibold">{totalRefs}</p>
              <p className="text-[10px] text-muted-foreground">References found</p>
            </div>
          </div>

          {successfulSearches.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-base font-semibold text-foreground mb-3">Recent Successful Searches</h2>
              <div className="space-y-2">
                {successfulSearches.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.query || `${entry.references[0].book} ${entry.references[0].chapter}:${entry.references[0].verseStart}`}
                      </p>
                      <span className="shrink-0 text-xs text-primary">{entry.references.length} found</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-serif text-base font-semibold text-foreground mb-3">Badges</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {badges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-xl border p-3 text-center transition-colors ${
                  badge.unlocked
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/30 opacity-50"
                }`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <p className="font-serif text-xs font-semibold mt-1 text-foreground">{badge.title}</p>
                <p className="text-[10px] text-muted-foreground">{badge.description}</p>
              </motion.div>
            ))}
          </div>

          <Button variant="outline" onClick={handleSignOut} className="mt-auto">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </TabsContent>

        <TabsContent value="settings" className="mt-5 space-y-5">
          <section className="space-y-3" aria-labelledby="provider-heading">
            <h2 id="provider-heading" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bible provider
            </h2>
            <RadioGroup value={provider} onValueChange={(value) => setProvider(value as BibleProviderId)} className="space-y-3">
              {PROVIDERS.map(({ id, title, description, icon: Icon }) => (
                <Label
                  key={id}
                  htmlFor={`provider-${id}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    provider === id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{title}</span>
                    <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{description}</span>
                  </span>
                  <RadioGroupItem id={`provider-${id}`} value={id} aria-label={title} className="mt-1" />
                </Label>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">The setting is saved on this device and applies to new searches.</p>
          </section>

          <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/about")}>
            About Speak Scripture <ExternalLink className="h-4 w-4" />
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
