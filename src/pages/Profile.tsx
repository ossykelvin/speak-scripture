import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookMarked, CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getBadges, getCurrentTitle } from "@/lib/badges";
import { loadHistory } from "@/lib/history";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const history = loadHistory();
  const totalRefs = history.reduce((sum, e) => sum + e.references.length, 0);
  const successfulSearches = history.filter((entry) => entry.references.length > 0);
  const badges = getBadges(totalRefs);
  const currentTitle = getCurrentTitle(totalRefs);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      supabase
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
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated." });
    }
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
        </div>
      </div>

      {/* Edit name */}
      <div className="space-y-2 mb-8">
        <Label htmlFor="displayName">Display Name</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "..." : "Save"}
          </Button>
        </div>
      </div>

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

      {/* Badge Gallery */}
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

      {/* Sign Out */}
      <Button variant="outline" onClick={handleSignOut} className="mt-auto">
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
};

export default Profile;
