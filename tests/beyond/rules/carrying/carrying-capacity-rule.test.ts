import { describe, expect, it } from "vitest";
import { madeUpRuleCharacter, scoresOf } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

describe("CarryingCapacityRule", () => {
  it.each([
    { strength: 1, capacity: 15 },
    { strength: 10, capacity: 150 },
    { strength: 11, capacity: 165 },
    { strength: 20, capacity: 300 },
  ])("is 15 times a strength of $strength: $capacity", ({ strength, capacity }) => {
    expect(numberNamed(madeUpRuleCharacter({ baseScores: scoresOf(strength, 10, 10, 10, 10, 10) }), "Carrying capacity").valueOr(-1)).toBe(capacity);
  });

  it("shows the working", () => {
    expect(numberNamed(madeUpRuleCharacter({}), "Carrying capacity").explanation).toBe("15 x STR 10 = 150");
  });

  it("does not know it when strength is not known", () => {
    expect(numberNamed(madeUpRuleCharacter({ baseScores: scoresOf(0, 10, 10, 10, 10, 10) }), "Carrying capacity").isKnown).toBe(false);
  });
});

describe("CarryingCapacityRule and size", () => {
  const strong = scoresOf(10, 10, 10, 10, 10, 10);

  it.each([
    { size: "small", capacity: 150 },
    { size: "medium", capacity: 150 },
    { size: "large", capacity: 300 },
    { size: "huge", capacity: 600 },
    { size: "gargantuan", capacity: 1200 },
    { size: " Large ", capacity: 300 },
  ])("is $capacity for a $size character of strength 10", ({ size, capacity }) => {
    expect(numberNamed(madeUpRuleCharacter({ size, baseScores: strong }), "Carrying capacity").valueOr(-1)).toBe(capacity);
  });

  it("halves it for a tiny character, and does not know it when the half is not whole", () => {
    expect(numberNamed(madeUpRuleCharacter({ size: "tiny", baseScores: strong }), "Carrying capacity").valueOr(-1)).toBe(75);
    const odd = numberNamed(madeUpRuleCharacter({ size: "tiny", baseScores: scoresOf(11, 10, 10, 10, 10, 10) }), "Carrying capacity");
    expect([odd.isKnown, odd.explanation]).toEqual([false, "15 x STR 11 x 0.5 is not a whole number."]);
  });

  it("does not know it when the size is not known", () => {
    const found = numberNamed(madeUpRuleCharacter({ size: "" }), "Carrying capacity");
    expect([found.isKnown, found.explanation]).toEqual([false, "The size is not known, and the carrying capacity depends on it."]);
  });

  it("counts a Powerful Build as one size larger, and a gargantuan one as the same", () => {
    expect(numberNamed(madeUpRuleCharacter({ size: "medium", features: ["Powerful Build"], baseScores: strong }), "Carrying capacity").valueOr(-1)).toBe(300);
    expect(numberNamed(madeUpRuleCharacter({ size: "small", features: ["powerful build"], baseScores: strong }), "Carrying capacity").valueOr(-1)).toBe(150);
    expect(numberNamed(madeUpRuleCharacter({ size: "gargantuan", features: ["Powerful Build"], baseScores: strong }), "Carrying capacity").valueOr(-1)).toBe(1200);
  });

  it.each(["Powerful Build", "Equine Build", "Hulking Build", " equine build "])("counts the trait %s as one size larger", (trait) => {
    expect(numberNamed(madeUpRuleCharacter({ size: "medium", features: [trait], baseScores: strong }), "Carrying capacity").valueOr(-1)).toBe(300);
  });

  it("says which size the load is for", () => {
    expect(numberNamed(madeUpRuleCharacter({ size: "large", baseScores: strong }), "Carrying capacity").explanation).toBe("15 x STR 10 x 2 for a large load = 300");
  });
});

describe("CarryingCapacityRule with a Powerful Build and an unknown size", () => {
  it("does not make an unknown size a tiny one one size larger", () => {
    const found = numberNamed(madeUpRuleCharacter({ size: "", features: ["Powerful Build"] }), "Carrying capacity");
    expect(found.isKnown).toBe(false);
  });
});
