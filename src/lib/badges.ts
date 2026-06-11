import { appConfig } from "@/config";

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  unlocked: boolean;
}

const BADGE_METADATA = [
  { id: "first-scripture", title: "First Scripture", icon: "1" },
  { id: "seeker", title: "Seeker", icon: "10" },
  { id: "faithful-listener", title: "Faithful Listener", icon: "25" },
  { id: "scripture-scholar", title: "Scripture Scholar", icon: "50" },
  { id: "word-champion", title: "Word Champion", icon: "100" },
  { id: "living-word-master", title: "Living Word Master", icon: "250" },
];

export const BADGE_DEFINITIONS: Omit<Badge, "unlocked">[] = BADGE_METADATA.map((badge, index) => {
  const threshold = appConfig.badgeThresholds[index];
  return {
    ...badge,
    threshold,
    description: `Find ${threshold} scripture reference${threshold === 1 ? "" : "s"}`,
  };
});

export function getBadges(totalReferences: number): Badge[] {
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    unlocked: totalReferences >= badge.threshold,
  }));
}

export function getCurrentTitle(totalReferences: number): string {
  const unlocked = BADGE_DEFINITIONS.filter((badge) => totalReferences >= badge.threshold);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1].title : "New Listener";
}

export function getBadgeProgress(totalReferences: number) {
  const current = [...BADGE_DEFINITIONS]
    .reverse()
    .find((badge) => totalReferences >= badge.threshold) ?? null;
  const next = BADGE_DEFINITIONS.find((badge) => totalReferences < badge.threshold) ?? null;
  const previousThreshold = current?.threshold ?? 0;
  const progress = next
    ? Math.min(100, ((totalReferences - previousThreshold) / (next.threshold - previousThreshold)) * 100)
    : 100;

  return { current, next, progress };
}
