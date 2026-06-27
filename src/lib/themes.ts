export type Theme =
  | "light"
  | "dark"
  | "luminous-night"
  | "monochrome-slate"
  | "cedar-grove"
  | "verdant-canopy";

export const themeOptions: Array<{ value: Theme; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Original bright theme" },
  { value: "dark", label: "Dark", description: "Original dark theme" },
  { value: "luminous-night", label: "Luminous Night", description: "Black glass with soft neon accents" },
  { value: "monochrome-slate", label: "Monochrome Slate", description: "Clean grayscale panels with charcoal controls" },
  { value: "cedar-grove", label: "Cedar Grove", description: "Warm wood tones with amber scripture accents" },
  { value: "verdant-canopy", label: "Verdant Canopy", description: "Leafy greens with soft botanical light" },
];

const themeValues = new Set<string>(themeOptions.map((option) => option.value));

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themeValues.has(value);
}
