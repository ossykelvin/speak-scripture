import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, User } from "lucide-react";
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
    <div className="flex flex-col min-h-screen max-w-lg mx-auto px-5 py-6">
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
          <p className="text-xs text-muted-foreground mt-1">{totalRefs} total references found</p>
        </div>
      </div>

      {/* Edit name */}
      <div className="space-y-2 mb-8">
        <Label htmlFor="displayName">Display Name</Label>
        <div className="flex gap-2">
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
