import { describe, expect, it } from "vitest";
import { noteBoxOver } from "./box-picture";
import { contrast, over, parseColour, type Colour } from "./css-colour";
import { SEE_THROUGH, THEMES } from "./sample-themes";
import { tokensFor, type ThemeContext } from "./theme-tokens";

const PICTURES: [string, Colour][] = [
  ["black", parseColour("black")],
  ["white", parseColour("white")],
];
const ALL_THEMES: [string, ThemeContext][] = [...Object.entries(THEMES), ["Frosted Glass", SEE_THROUGH]];

describe("the note box's faint picture", () => {
  describe.each(ALL_THEMES)("in %s", (_name, context) => {
    const token = tokensFor(context);

    it.each(PICTURES)("keeps typed notes at 4.5:1 over a %s picture", (_picture, colour) => {
      const behind = noteBoxOver(token, colour);
      expect(contrast(over(token("text-body"), behind), behind)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
