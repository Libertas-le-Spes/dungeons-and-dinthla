import type { ThemeContext } from "./theme-tokens";

export const TOKYO_NIGHT: Record<string, string> = {
  "--background-primary": "#1a1b26",
  "--background-primary-alt": "#1f2335",
  "--background-secondary": "#16161e",
  "--background-secondary-alt": "#24283b",
  "--background-modifier-hover": "rgba(192, 202, 245, 0.07)",
  "--background-modifier-active-hover": "rgba(192, 202, 245, 0.12)",
  "--background-modifier-cover": "rgba(0, 0, 0, 0.55)",
  "--background-modifier-border": "#292e42",
  "--background-modifier-border-hover": "#737aa2",
  "--background-modifier-border-focus": "#7aa2f7",
  "--text-normal": "#c0caf5",
  "--text-muted": "#a9b1d6",
  "--text-faint": "#737aa2",
  "--text-accent": "#7aa2f7",
  "--interactive-accent": "#7aa2f7",
  "--text-on-accent": "#16161e",
  "--text-error": "#f7768e",
  "--color-blue": "#7aa2f7",
  "--color-yellow": "#e0af68",
  "--color-green": "#9ece6a",
  "--color-purple": "#bb9af7",
  "--color-cyan": "#7dcfff",
};

export const CATPPUCCIN_LATTE: Record<string, string> = {
  "--background-primary": "#eff1f5",
  "--background-primary-alt": "#f5f6f9",
  "--background-secondary": "#e6e9ef",
  "--background-secondary-alt": "#f8f9fb",
  "--background-modifier-hover": "rgba(76, 79, 105, 0.07)",
  "--background-modifier-active-hover": "rgba(76, 79, 105, 0.12)",
  "--background-modifier-cover": "rgba(76, 79, 105, 0.35)",
  "--background-modifier-border": "#ccd0da",
  "--background-modifier-border-hover": "#8c8fa1",
  "--background-modifier-border-focus": "#8839ef",
  "--text-normal": "#4c4f69",
  "--text-muted": "#5c5f77",
  "--text-faint": "#6c6f85",
  "--text-accent": "#8839ef",
  "--interactive-accent": "#8839ef",
  "--text-on-accent": "#eff1f5",
  "--text-error": "#d20f39",
  "--color-blue": "#1e66f5",
  "--color-yellow": "#df8e1d",
  "--color-green": "#40a02b",
  "--color-purple": "#8839ef",
  "--color-cyan": "#179299",
};

const FROSTED_GLASS: Record<string, string> = {
  ...TOKYO_NIGHT,
  "--background-primary": "rgba(26, 27, 38, 0.55)",
  "--background-primary-alt": "rgba(31, 35, 53, 0.6)",
  "--background-secondary": "rgba(22, 22, 30, 0.55)",
  "--background-secondary-alt": "rgba(36, 40, 59, 0.6)",
};

export const THEMES: Record<string, ThemeContext> = {
  "Dinthla light": { dark: false, follow: false, obsidian: {} },
  "Dinthla dark": { dark: true, follow: false, obsidian: {} },
  "Tokyo Night": { dark: true, follow: true, obsidian: TOKYO_NIGHT },
  "Catppuccin Latte": { dark: false, follow: true, obsidian: CATPPUCCIN_LATTE },
};

export const SEE_THROUGH: ThemeContext = { dark: true, follow: true, obsidian: FROSTED_GLASS };
