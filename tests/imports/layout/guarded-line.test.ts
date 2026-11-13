import { describe, expect, it } from "vitest";
import { guardedLineOf } from "../../../src/imports/layout/guarded-line";

describe("guardedLineOf", () => {
  it("escapes the characters inside the line", () => {
    expect(guardedLineOf("Rope (50 ft) *silk*")).toBe("Rope (50 ft) \\*silk\\*");
  });

  it.each([
    ["Potion: Healing", "Potion\\: Healing"],
    ["1. Arrows", "1\\. Arrows"],
    ["~Cloak", "\\~Cloak"],
  ])("guards the start of %s", (line, guarded) => {
    expect(guardedLineOf(line)).toBe(guarded);
  });

  it("escapes before it guards, so a line starting with an escaped character gets one backslash", () => {
    expect(guardedLineOf("#loot")).toBe("\\#loot");
  });
});
