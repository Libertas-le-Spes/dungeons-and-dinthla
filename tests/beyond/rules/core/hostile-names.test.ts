import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, numberNamed } from "../../builders/made-up-rule-character";

const EVIL = "Evil ## [[x]] `c`";

describe("a chain of reasons with hostile class names", () => {
  const character = madeUpRuleCharacter({ classes: [classOf(EVIL, 3, 8), classOf(EVIL, 2, 8)] });

  it("escapes the hostile name once, where it first appears", () => {
    expect(numberNamed(character, "Total level").explanation).toBe("The class Evil \\#\\# \\[\\[x\\]\\] \\`c\\` is listed more than once.");
  });

  it("states Passive Perception's real reason, not a too-long placeholder", () => {
    expect(numberNamed(character, "Passive Perception").explanation).toBe("It needs Perception, which is not known.");
  });

  it("states the reason down every step of the chain, with nothing escaped twice", () => {
    const reasons = ["Proficiency bonus", "Perception", "Hit dice", "Passive Insight"].map((name) => numberNamed(character, name).explanation);
    expect(reasons.every((reason) => reason.includes("\\\\") === false)).toBe(true);
  });
});
