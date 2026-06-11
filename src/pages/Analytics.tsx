import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart3, BookMarked, CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadHistory } from "@/lib/history";
import { computeAnalytics, type Period } from "@/lib/analytics";
import { getBadgeProgress, getBadges, getCurrentTitle } from "@/lib/badges";

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const Analytics = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("daily");
  const history = useMemo(() => loadHistory(), []);
  const stats = useMemo(() => computeAnalytics(history, period), [history, period]);
  const totalAllTime = useMemo(
    () => history.reduce((sum, entry) => sum + entry.references.length, 0),
    [history],
  );
  const totalFailures = useMemo(
    () => history.reduce((sum, entry) => sum + (entry.failedSearches ?? 0), 0),
    [history],
  );
  const badges = useMemo(() => getBadges(totalAllTime), [totalAllTime]);
  const title = useMemo(() => getCurrentTitle(totalAllTime), [totalAllTime]);
  const badgeProgress = useMemo(() => getBadgeProgress(totalAllTime), [totalAllTime]);

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <header className="flex items-center gap-3 px-5 pt-6 pb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="font-serif text-lg font-semibold text-foreground tracking-wide">Analytics</h1>
        </div>
      </header>

      <div className="mx-5 mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Badge</p>
          <p className="font-serif text-lg font-semibold text-primary">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalAllTime} successful scripture searches</p>
        </div>
        <Progress value={badgeProgress.progress} className="mt-4 h-2" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {badgeProgress.next
            ? `${badgeProgress.next.threshold - totalAllTime} more to unlock ${badgeProgress.next.title}`
            : "All configured badges unlocked"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mb-4">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-semibold">{totalAllTime}</p>
          <p className="text-[10px] text-muted-foreground">All-time successes</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <XCircle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-semibold">{totalFailures}</p>
          <p className="text-[10px] text-muted-foreground">All-time no matches</p>
        </div>
      </div>

      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="flex-1 flex flex-col px-4 pb-4">
        <TabsList className="w-full">
          <TabsTrigger value="daily" className="flex-1">Today</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">This Week</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">This Month</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value={period} className="mt-4 space-y-4" key={period}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
              <Stat icon={<BookMarked className="h-4 w-4" />} value={stats.totalReferences} label="Found" />
              <Stat icon={<XCircle className="h-4 w-4" />} value={stats.failedSearches} label="No match" />
              <Stat icon={<Clock className="h-4 w-4" />} value={formatDuration(stats.totalDuration)} label="Listening" />
              <Stat icon={<BarChart3 className="h-4 w-4" />} value={stats.sessions} label="Searches" />
            </motion.div>

            {stats.topBooks.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Top Books</p>
                <div className="space-y-2">
                  {stats.topBooks.map((book) => (
                    <div key={book.book} className="flex items-center justify-between">
                      <span className="text-sm font-serif text-foreground">{book.book}</span>
                      <span className="text-xs text-muted-foreground">{book.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {history.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Recent Searches</p>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border bg-card p-3 flex justify-between gap-3">
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString()}</span>
                <span className="text-xs text-foreground">{entry.references.length} found</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Badges</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-lg border p-3 text-center ${badge.unlocked ? "border-primary/30 bg-primary/5" : "border-border bg-card opacity-45"}`}
            >
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                {badge.icon}
              </span>
              <p className="text-xs font-serif font-semibold text-foreground mt-1">{badge.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2 text-center">
      <span className="text-primary flex justify-center mb-1">{icon}</span>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default Analytics;
