import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const themeSelectors = [
  ":root",
  ".dark",
  ".luminous-night",
  ".monochrome-slate",
  ".cedar-grove",
  ".verdant-canopy",
] as const;

const contrastPairs = [
  ["foreground", "background", "body text"],
  ["card-foreground", "card", "card text"],
  ["popover-foreground", "popover", "popover text"],
  ["primary-foreground", "primary", "primary button"],
  ["secondary-foreground", "secondary", "secondary button"],
  ["accent-foreground", "accent", "accent button"],
  ["destructive-foreground", "destructive", "destructive button"],
  ["muted-foreground", "background", "muted text on background"],
  ["muted-foreground", "card", "muted text on card"],
  ["muted-foreground", "muted", "muted text on muted panel"],
  ["primary", "background", "primary text on background"],
  ["primary", "card", "primary text on card"],
] as const;

type ThemeTokens = Record<string, string>;
type Rgb = [number, number, number];

function parseThemeBlock(css: string, selector: string): ThemeTokens {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m"));
  if (!match) throw new Error(`Missing theme selector ${selector}`);

  return Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/--([\w-]+):\s*([^;]+);/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], match[2].trim()]),
  );
}

function hslToRgb(hsl: string): Rgb {
  const [rawHue, rawSaturation, rawLightness] = hsl.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const hue = (((rawHue % 360) + 360) % 360) / 360;
  const saturation = rawSaturation / 100;
  const lightness = rawLightness / 100;

  if (saturation === 0) return [lightness, lightness, lightness];

  const hueToRgb = (p: number, q: number, t: number) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return [
    hueToRgb(p, q, hue + 1 / 3),
    hueToRgb(p, q, hue),
    hueToRgb(p, q, hue - 1 / 3),
  ];
}

function relativeLuminance(rgb: Rgb): number {
  return rgb
    .map((channel) => channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(firstHsl: string, secondHsl: string): number {
  const first = relativeLuminance(hslToRgb(firstHsl));
  const second = relativeLuminance(hslToRgb(secondHsl));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("theme color contrast", () => {
  it("keeps core theme token pairs at WCAG AA contrast or better", () => {
    const css = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
    const failures: string[] = [];

    for (const selector of themeSelectors) {
      const tokens = parseThemeBlock(css, selector);
      for (const [foreground, background, label] of contrastPairs) {
        const ratio = contrastRatio(tokens[foreground], tokens[background]);
        if (ratio < 4.5) {
          failures.push(`${selector} ${label}: ${ratio.toFixed(2)}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
