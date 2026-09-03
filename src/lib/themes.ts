export type ThemeKey = "emerald" | "royal" | "blood" | "gold" | "violet" | "dark";

export const THEMES: { key: ThemeKey; label: string; swatch: string }[] = [
  { key: "emerald", label: "Verde", swatch: "linear-gradient(to right, #16a34a, #22c55e)" },
  { key: "royal", label: "Azul royal", swatch: "linear-gradient(to right, #1d4ed8, #3b82f6)" },
  { key: "blood", label: "Vermelho", swatch: "linear-gradient(to right, #b91c1c, #ef4444)" },
  { key: "gold", label: "Dourado", swatch: "linear-gradient(to right, #b45309, #facc15)" },
  { key: "violet", label: "Roxo", swatch: "linear-gradient(to right, #7e22ce, #a855f7)" },
  { key: "dark", label: "Dark neutro", swatch: "linear-gradient(to right, #27272a, #e5e7eb)" },
];

export const DEFAULT_THEME: ThemeKey = "emerald";

export function isThemeKey(value: string): value is ThemeKey {
  return THEMES.some((t) => t.key === value);
}

export type ColorScheme = "light" | "dark";

export const DEFAULT_COLOR_SCHEME: ColorScheme = "dark";

export function isColorScheme(value: string): value is ColorScheme {
  return value === "light" || value === "dark";
}
