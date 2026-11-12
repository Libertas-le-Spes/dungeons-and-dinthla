import { describe, expect, it } from "vitest";
import { knownIn, knownNumber, notKnown } from "../../../../src/beyond/rules/core/worked";
import { neutralWorking, shortList } from "../../../../src/beyond/rules/core/working-text";
import { SCORE } from "../../../../src/beyond/shape/import-limits";
import { ROUTE } from "../../builders/made-up-rule-character";

const EVIL = "Evil\n## Heading [[x]]";

describe("neutralWorking", () => {
  it("puts a line break on the same line and escapes the markup", () => {
    expect(neutralWorking(EVIL)).toBe("Evil \\#\\# Heading \\[\\[x\\]\\]");
  });

  it("leaves a plain working as it is", () => {
    expect(neutralWorking("10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence")).toBe("10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence");
  });

  it("replaces a working over the line length with a plain sentence", () => {
    expect(neutralWorking("x".repeat(301))).toBe("The working is too long to show.");
  });

  it("keeps a working exactly at the line length", () => {
    expect(neutralWorking("x".repeat(300))).toBe("x".repeat(300));
  });
});

describe("the worked value makers", () => {
  it("make a known number's working neutral", () => {
    expect(knownNumber(1, EVIL, ROUTE).explanation).toBe("Evil \\#\\# Heading \\[\\[x\\]\\]");
  });

  it("make a number in range's working neutral", () => {
    expect(knownIn(10, SCORE, EVIL, ROUTE).explanation).toBe("Evil \\#\\# Heading \\[\\[x\\]\\]");
  });

  it("make a reason neutral and keep the route", () => {
    const value = notKnown(EVIL, ROUTE);
    expect([value.explanation, value.route, value.isKnown]).toEqual(["Evil \\#\\# Heading \\[\\[x\\]\\]", ROUTE, false]);
  });
});

describe("shortList", () => {
  it("lists up to five names", () => {
    expect(shortList(["a", "b", "c", "d", "e"])).toBe("a, b, c, d, e");
  });

  it("counts the rest after five", () => {
    expect(shortList(["a", "b", "c", "d", "e", "f", "g"])).toBe("a, b, c, d, e and 2 more");
  });
});
