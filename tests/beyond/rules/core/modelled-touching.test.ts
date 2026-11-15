import { describe, expect, it } from "vitest";
import type { Edition } from "../../../../src/beyond/rules/input/edition";
import { classOf, madeUpRuleCharacter, modifierOf } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

const UNSETTLED_EDITIONS: Edition[] = ["2014", "not stated"];

describe("Remarkable Athlete", () => {
  it("changes no skill and no initiative in the 2024 rules, where it gives only advantage", () => {
    const character = madeUpRuleCharacter({ features: ["Remarkable Athlete"], edition: "2024" });
    expect([numberNamed(character, "Athletics").isKnown, numberNamed(character, "Initiative").isKnown]).toEqual([true, true]);
  });

  it.each(UNSETTLED_EDITIONS)("makes every skill and initiative not known in the %s rules", (edition) => {
    const character = madeUpRuleCharacter({ features: ["Remarkable Athlete"], edition });
    expect([numberNamed(character, "Athletics").isKnown, numberNamed(character, "Initiative").isKnown]).toEqual([false, false]);
  });

  it("still makes a feature without that exemption not known in the 2024 rules", () => {
    expect(numberNamed(madeUpRuleCharacter({ features: ["Tactical Wit"], edition: "2024" }), "Initiative").isKnown).toBe(false);
  });
});

describe("Alert, which D&D Beyond states as a modifier", () => {

  it("is worked into initiative when a modifier of its own touches initiative", () => {
    const character = madeUpRuleCharacter({ features: ["Alert"], modifiers: [modifierOf("bonus", "initiative", 5, "Alert")] });
    expect(numberNamed(character, "Initiative").valueOr(0)).toBe(5);
  });

  it("is not worked in when its modifier has a restriction", () => {
    const character = madeUpRuleCharacter({ features: ["Alert"], modifiers: [modifierOf("bonus", "initiative", 5, "Alert", "while awake")] });
    expect(numberNamed(character, "Initiative").isKnown).toBe(false);
  });

  it("is not worked in when its modifier does not touch initiative", () => {
    const character = madeUpRuleCharacter({ features: ["Alert"], modifiers: [modifierOf("bonus", "speed", 5, "Alert")] });
    expect(numberNamed(character, "Initiative").isKnown).toBe(false);
  });

  it("is not worked in when its modifier comes from another source", () => {
    const character = madeUpRuleCharacter({ features: ["Alert"], modifiers: [modifierOf("bonus", "initiative", 5, "Pale Charm")] });
    expect(numberNamed(character, "Initiative").isKnown).toBe(false);
  });

  it("is not worked in when its modifier is not in force", () => {
    const off = { ...modifierOf("bonus", "initiative", 5, "Alert"), inForce: false };
    expect(numberNamed(madeUpRuleCharacter({ features: ["Alert"], modifiers: [off] }), "Initiative").isKnown).toBe(false);
  });

  it("matches the source name without regard to case", () => {
    const character = madeUpRuleCharacter({ features: ["Alert"], modifiers: [modifierOf("bonus", "initiative", 5, " alert ")] });
    expect(numberNamed(character, "Initiative").valueOr(0)).toBe(5);
  });

  it("is named when another feature of the same list is not worked in", () => {
    const character = madeUpRuleCharacter({ features: ["Alert", "Tactical Wit"], classes: [classOf("Fighter", 1, 10)], modifiers: [modifierOf("bonus", "initiative", 5, "Alert")] });
    expect(numberNamed(character, "Initiative").explanation).toBe("Tactical Wit may change this.");
  });
});

describe("a feature that is not modelled", () => {
  it("stays named when a modifier of its own touches the value", () => {
    const character = madeUpRuleCharacter({ features: ["Tactical Wit"], modifiers: [modifierOf("bonus", "initiative", 2, "Tactical Wit")] });
    expect(numberNamed(character, "Initiative").explanation).toBe("Tactical Wit may change this.");
  });
});
