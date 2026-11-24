import { describe, expect, it } from "vitest";
import { contrast, distance, over, parseColour, type Colour } from "./css-colour";
import { panelOver } from "./panel-background";
import { textColourTokens, unclassifiedTextColours } from "./style-files";
import { CATPPUCCIN_LATTE, OBSIDIAN_DARK, OBSIDIAN_LIGHT, SEE_THROUGH, THEMES, TOKYO_NIGHT } from "./sample-themes";
import { tokensFor, type ThemeContext } from "./theme-tokens";

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
  ["state-imported", "state-imported-soft", 4.5],
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
  it("takes the theme's own surfaces and text in place of any palette of the plugin's own", () => {
    const token = tokensFor(THEMES["Tokyo Night"]!);
    expect(token("surface-page")).toEqual(parseColour("#1a1b26"));
    expect(token("text-body")).toEqual(parseColour("#c0caf5"));
  });
});

describe.each(Object.entries(THEMES))("the colours of meaning in %s", (_name, context) => {
  const token = tokensFor(context);
  const MARKERS = ["marker-question", "marker-quest", "marker-ledger"];
  const STATES = ["state-override", "state-carried", "state-imported"];
  const MINIMUM_FROM_TEXT = 0.08;
  const MINIMUM_APART = 0.05;

  it.each([...MARKERS, ...STATES])("%s stands clearly apart from body text", (name) => {
    expect(distance(token(name), token("text-body"))).toBeGreaterThanOrEqual(MINIMUM_FROM_TEXT);
  });

  it.each([
    ["markers", MARKERS],
    ["states", STATES],
  ])("the %s are clearly apart from each other", (_group, names) => {
    for (const [index, first] of names.entries()) {
      for (const second of names.slice(index + 1)) {
        expect(distance(token(first), token(second)), `${first} and ${second}`).toBeGreaterThanOrEqual(MINIMUM_APART);
      }
    }
  });
});

describe.each(Object.entries(THEMES))("faint text in %s", (_name, context) => {
  const token = tokensFor(context);
  const page = parseColour(context.obsidian["--background-primary"] as string);
  const seen = (name: string) => over(token(name), page);

  it("is never stronger than muted text", () => {
    expect(contrast(seen("text-faint-ui"), page)).toBeLessThanOrEqual(contrast(seen("text-muted-ui"), page));
  });
});

describe("markers in Obsidian's own editor", () => {
  const EDITOR_BACKGROUNDS: [string, ThemeContext, string][] = [
    ["Obsidian light", { obsidian: OBSIDIAN_LIGHT }, OBSIDIAN_LIGHT["--background-primary"] as string],
    ["Obsidian dark", { obsidian: OBSIDIAN_DARK }, OBSIDIAN_DARK["--background-primary"] as string],
    ["Tokyo Night", { obsidian: TOKYO_NIGHT }, TOKYO_NIGHT["--background-primary"] as string],
    ["Catppuccin Latte", { obsidian: CATPPUCCIN_LATTE }, CATPPUCCIN_LATTE["--background-primary"] as string],
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
    "state-imported": softOn("state-imported-soft"),
    "state-history": [PAGE, CARD],
    "statblock-heading": [PAGE, CARD, STATBLOCK],
    "statblock-text": [STATBLOCK],
    "statblock-subtitle": [STATBLOCK],
  };
  const SOLID = ["surface-page", "surface-card", "surface-sunken", "surface-raised", "surface-statblock"];
  const cases = Object.entries(TEXT_ON).flatMap(([text, surfaces]) => surfaces.map((layers): [string, string[]] => [text, layers]));
  const OPAQUE_THEMES = ["Obsidian light", "Obsidian dark"];
  const PANEL_THEMES: [string, ThemeContext][] = [...Object.entries(THEMES), ["Frosted Glass", SEE_THROUGH]];
  const PANELS_IN_TAB = [".dd-campaign .dd-nav", ".dd-campaign .dd-page-body"];

  function layered(token: (name: string) => Colour, layers: string[], panel: Colour): Colour {
    let behind = panel;
    for (const layer of [...layers].reverse()) behind = over(token(layer), behind);
    return behind;
  }

  it("names a surface for every colour the plugin gives text", () => {
    const missing = [...textColourTokens()].filter((token) => !(token in TEXT_ON));
    expect(missing).toEqual([]);
  });

  it("knows what every colour the plugin gives text is", () => {
    expect(unclassifiedTextColours()).toEqual([]);
  });

  it("starts Frosted Glass with a page colour the picture shows through", () => {
    expect(tokensFor(SEE_THROUGH)("surface-page").alpha).toBeLessThan(1);
  });

  describe.each(OPAQUE_THEMES)("in %s", (name) => {
    const token = tokensFor(THEMES[name]!);

    it.each(SOLID)("%s hides the picture entirely", (surface) => {
      expect(token(surface).alpha).toBe(1);
    });
  });

  describe.each(PANEL_THEMES)("in %s", (_name, context) => {
    const token = tokensFor(context);

    it.each(PANELS_IN_TAB)("%s hides the picture entirely", (selector) => {
      const overBlack = panelOver(token, "plugin/campaign.css", selector, PICTURES[0]![1]);
      const overWhite = panelOver(token, "plugin/campaign.css", selector, PICTURES[1]![1]);
      expect(overBlack).toEqual(overWhite);
    });

    it.each(cases)("%s on %j reaches 4.5:1 over a black or a white picture", (text, layers) => {
      const bottom = layers.at(-1);
      expect(SOLID).toContain(bottom);
      for (const selector of PANELS_IN_TAB) {
        for (const [picture, colour] of PICTURES) {
          const behind = layered(token, layers, panelOver(token, "plugin/campaign.css", selector, colour));
          expect(contrast(over(token(text), behind), behind), `${picture} behind ${selector}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  });
});
