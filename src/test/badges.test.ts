import { describe, expect, it } from "vitest";
import { getBadgeProgress, getBadges, getCurrentTitle } from "@/lib/badges";
import { parseBadgeThresholds } from "@/config";

describe("badge configuration", () => {
  it("parses six sorted unique thresholds", () => {
    expect(parseBadgeThresholds("100,1,25,10,250,50")).toEqual([1, 10, 25, 50, 100, 250]);
  });

  it("falls back when threshold configuration is incomplete", () => {
    expect(parseBadgeThresholds("1,10")).toEqual([1, 10, 25, 50, 100, 250]);
  });

  it("unlocks badges and reports the next target", () => {
    expect(getBadges(10).filter((badge) => badge.unlocked)).toHaveLength(2);
    expect(getCurrentTitle(10)).toBe("Seeker");
    expect(getBadgeProgress(10).next?.threshold).toBe(25);
  });
});
