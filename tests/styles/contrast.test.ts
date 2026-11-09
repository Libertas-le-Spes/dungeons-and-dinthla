import { describe, expect, it } from "vitest";
import { contrast, over, parseColour, type Colour } from "./css-colour";
import { backgroundOf, textColourTokens } from "./style-files";
import { tokensFor, type ThemeContext } from "./theme-tokens";

const TOKYO_NIGHT: Record<string, string> = {
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

const CATPPUCCIN_LATTE: Record<string, string> = {
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

const THEMES: Record<string, ThemeContext> = {
  "Dinthla light": { dark: false, follow: false, obsidian: {} },
  "Dinthla dark": { dark: true, follow: false, obsidian: {} },
  "Tokyo Night": { dark: true, follow: true, obsidian: TOKYO_NIGHT },
  "Catppuccin Latte": { dark: false, follow: true, obsidian: CATPPUCCIN_LATTE },
};

const PAIRS: [string, string, number][] = [
  ["text-strong", "surface-page", 4.5],
  ["text-body", "surface-card", 4.5],
  ["text-strong", "surface-card", 4.5],
  ["text-body", "surface-sunken", 4.5],
  ["text-muted-ui", "surface-page", 4.5],
  ["text-muted-ui", "surface-card", 4.5],
  ["text-muted-ui", "surface-sunken", 4.5],
  ["text-muted-ui", "surface-raised", 4.5],
  ["text-faint-ui", "surface-page", 4.5],
  ["text-faint-ui", "surface-card", 4.5],
  ["text-faint-ui", "surface-sunken", 4.5],
  ["text-faint-ui", "surface-raised", 4.5],
  ["text-link", "surface-page", 4.5],
  ["text-link", "surface-card", 4.5],
  ["text-on-accent", "accent", 4.5],
  ["text-on-accent", "accent-hover", 4.5],
  ["text-on-accent", "accent-press", 4.5],
  ["text-on-danger", "state-danger", 4.5],
  ["state-danger", "surface-card", 4.5],
  ["state-danger", "state-danger-soft", 4.5],
  ["marker-question", "surface-card", 4.5],
  ["marker-question", "marker-question-soft", 4.5],
  ["marker-quest", "surface-card", 4.5],
  ["marker-quest", "marker-quest-soft", 4.5],
  ["marker-ledger", "surface-card", 4.5],
  ["marker-ledger", "surface-page", 4.5],
  ["marker-ledger", "marker-ledger-soft", 4.5],
  ["marker-link", "surface-card", 4.5],
  ["marker-link", "marker-link-soft", 4.5],
  ["text-strong", "marker-ledger-soft", 4.5],
  ["text-strong", "marker-quest-soft", 4.5],
  ["text-strong", "marker-question-soft", 4.5],
  ["state-known", "surface-sunken", 4.5],
  ["state-unknown", "state-unknown-soft", 4.5],
  ["state-override", "state-override-soft", 4.5],
  ["state-carried", "state-carried-soft", 4.5],
  ["state-history", "surface-card", 4.5],
  ["statblock-heading", "surface-card", 4.5],
  ["statblock-heading", "surface-page", 4.5],
  ["statblock-heading", "surface-statblock", 4.5],
  ["statblock-text", "surface-statblock", 4.5],
  ["statblock-subtitle", "surface-statblock", 4.5],
  ["state-unknown", "surface-statblock", 4.5],
  ["border-strong", "surface-page", 3],
  ["border-strong", "surface-card", 3],
  ["border-strong", "surface-sunken", 3],
  ["border-focus", "surface-page", 3],
  ["border-focus", "surface-card", 3],
  ["accent", "surface-page", 3],
];

describe.each(Object.entries(THEMES))("contrast in %s", (_name, context) => {
  const token = tokensFor(context);
  const page = over(token("surface-page"), { r: 0, g: 0, b: 0, alpha: 1 });

  it.each(PAIRS)("%s on %s reaches %d:1", (foreground, background, needed) => {
    const behind = over(token(background), page);
    const ratio = contrast(over(token(foreground), behind), behind);
    expect(ratio).toBeGreaterThanOrEqual(needed);
  });
});

describe("following a community theme", () => {
  it("takes the theme's own surfaces and text over the Dinthla dark palette", () => {
    const token = tokensFor(THEMES["Tokyo Night"]!);
    expect(token("surface-page")).toEqual(parseColour("#1a1b26"));
    expect(token("text-body")).toEqual(parseColour("#c0caf5"));
  });
});

describe("markers in Obsidian's own editor", () => {
  const EDITOR_BACKGROUNDS: [string, ThemeContext, string][] = [
    ["Dinthla light", THEMES["Dinthla light"]!, "#ffffff"],
    ["Dinthla dark", THEMES["Dinthla dark"]!, "#1c1c1c"],
    ["Tokyo Night", THEMES["Tokyo Night"]!, TOKYO_NIGHT["--background-primary"]!],
    ["Catppuccin Latte", THEMES["Catppuccin Latte"]!, CATPPUCCIN_LATTE["--background-primary"]!],
  ];
  const MARKERS = ["marker-question", "marker-quest", "marker-ledger"];

  it.each(EDITOR_BACKGROUNDS)("reach 4.5:1 on the editor in %s", (_name, context, background) => {
    const token = tokensFor(context);
    for (const marker of MARKERS) {
      expect(contrast(token(marker), parseColour(background)), marker).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("text in the campaign tab over its background picture", () => {
  const PICTURES: [string, Colour][] = [
    ["black", parseColour("black")],
    ["white", parseColour("white")],
  ];
  const PAGE = ["surface-page"];
  const CARD = ["surface-card"];
  const SUNKEN = ["surface-sunken"];
  const RAISED = ["surface-raised"];
  const STATBLOCK = ["surface-statblock"];
  const PANELS = [PAGE, CARD, SUNKEN, RAISED];
  function softOn(soft: string): string[][] {
    return [
      [soft, "surface-page"],
      [soft, "surface-card"],
    ];
  }

  const TEXT_ON: Record<string, string[][]> = {
    "text-strong": [...PANELS, ...softOn("marker-question-soft"), ...softOn("marker-quest-soft"), ...softOn("marker-ledger-soft")],
    "text-body": [...PANELS, ["surface-hover", "surface-page"], ["surface-active", "surface-card"]],
    "text-muted-ui": PANELS,
    "text-faint-ui": PANELS,
    "text-link": [PAGE, CARD],
    "marker-question": [PAGE, CARD, ...softOn("marker-question-soft")],
    "marker-quest": [PAGE, CARD, ...softOn("marker-quest-soft")],
    "marker-ledger": [PAGE, CARD, ...softOn("marker-ledger-soft")],
    "marker-link": [PAGE, CARD, ...softOn("marker-link-soft")],
    "state-danger": [PAGE, CARD, ...softOn("state-danger-soft")],
    "state-known": [PAGE, SUNKEN],
    "state-unknown": [STATBLOCK, ...softOn("state-unknown-soft")],
    "state-override": softOn("state-override-soft"),
    "state-carried": softOn("state-carried-soft"),
    "state-history": [PAGE, CARD],
    "statblock-heading": [PAGE, CARD, STATBLOCK],
    "statblock-text": [STATBLOCK],
    "statblock-subtitle": [STATBLOCK],
  };
  const SOLID = ["surface-page", "surface-card", "surface-sunken", "surface-raised", "surface-statblock"];
  const cases = Object.entries(TEXT_ON).flatMap(([text, surfaces]) => surfaces.map((layers): [string, string[]] => [text, layers]));
  const DINTHLA = ["Dinthla light", "Dinthla dark"];

  function layered(token: (name: string) => Colour, layers: string[], picture: Colour): Colour {
    let behind = picture;
    for (const layer of [...layers].reverse()) behind = over(token(layer), behind);
    return behind;
  }

  it("names a surface for every colour the plugin gives text", () => {
    const missing = [...textColourTokens()].filter((token) => !(token in TEXT_ON));
    expect(missing).toEqual([]);
  });

  it("puts the sidebar and every page on the solid page colour", () => {
    expect(backgroundOf("campaign.css", ".dd-campaign .dd-nav")).toBe("var(--surface-page)");
    expect(backgroundOf("campaign.css", ".dd-campaign .dd-page-body")).toBe("var(--surface-page)");
  });

  describe.each(DINTHLA)("in %s", (name) => {
    const token = tokensFor(THEMES[name]!);

    it.each(SOLID)("%s hides the picture entirely", (surface) => {
      expect(token(surface).alpha).toBe(1);
    });

    it.each(cases)("%s on %j reaches 4.5:1 over a black or a white picture", (text, layers) => {
      const bottom = layers.at(-1);
      expect(SOLID).toContain(bottom);
      for (const [picture, colour] of PICTURES) {
        const behind = layered(token, layers, colour);
        expect(contrast(over(token(text), behind), behind), picture).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
});
