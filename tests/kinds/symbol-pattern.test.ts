import { describe, expect, it } from "vitest";
import { symbolPatternOf } from "../../src/kinds/symbol-pattern";

function wholeMatchOf(symbols: string[], text: string): string | undefined {
  const match = new RegExp(`^(${symbolPatternOf(symbols)})`).exec(text);
  if (match === null) return undefined;
  return match[1];
}

describe("symbolPatternOf", () => {
  it("matches symbols made of characters a pattern treats as special", () => {
    expect(wholeMatchOf(["$$"], "$$ lantern")).toBe("$$");
    expect(wholeMatchOf(["?+"], "?+ clue")).toBe("?+");
    expect(wholeMatchOf(["?+"], "?? clue")).toBeUndefined();
  });

  it("matches the longest symbol first", () => {
    expect(wholeMatchOf(["?", "?="], "?= answer")).toBe("?=");
  });

  it("matches a symbol ending in a letter only before a space or the end of the line", () => {
    expect(wholeMatchOf(["!x"], "!x burned")).toBe("!x");
    expect(wholeMatchOf(["!x"], "!x")).toBe("!x");
    expect(wholeMatchOf(["!x"], "!xylophone")).toBeUndefined();
  });
});
