import type { RuleCharacter } from "../../../../src/beyond/rules/input/rule-character";
import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

const EVIL = "Evil ## [[x]] `c`";

function reasonIn(character: RuleCharacter): (name: string) => string {
  return function reasonOf(name: string): string {
    return numberNamed(character, name).explanation;
  };
}

function hasBackslash(reason: string): boolean {
  return reason.includes("\\");
}

describe("a chain of reasons with hostile class names", () => {
  const character = madeUpRuleCharacter({ classes: [classOf(EVIL, 3, 8), classOf(EVIL, 2, 8)] });

  it("escapes the hostile name once, where it first appears", () => {
    expect(numberNamed(character, "Total level").explanation).toBe("The class Evil \\#\\# \\[\\[x\\]\\] \\`c\\` is listed more than once.");
  });

  it("states Passive Perception's real reason, not a too-long placeholder", () => {
    expect(numberNamed(character, "Passive Perception").explanation).toBe("Needs Perception.");
  });

  it("states the reason down every step of the chain, with nothing escaped twice", () => {
    const reasons = ["Proficiency bonus", "Perception", "Hit dice", "Passive Insight"].map(reasonIn(character));
    expect(reasons.filter(hasBackslash)).toEqual([]);
  });
});
