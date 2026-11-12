import { describe, expect, it } from "vitest";
import { workedOut } from "../../../src/beyond/rules/worked-out";
import { classOf, itemOf, madeUpRuleCharacter, modifierOf } from "../builders/made-up-rule-character";
import { NotArmour } from "../../../src/beyond/rules/input/armour/not-armour";

function manyOf<T>(count: number, make: (place: number) => T): T[] {
  const found: T[] = [];
  for (let place = 0; place < count; place += 1) found.push(make(place));
  return found;
}

describe("workedOut refuses a character that is too big and never trims it", () => {
  it("takes 2000 modifiers", () => {
    const modifiers = manyOf(2_000, (place) => modifierOf("bonus", "unrelated", 1, `Source ${place}`));
    expect(workedOut(madeUpRuleCharacter({ modifiers })).length).toBeGreaterThan(0);
  });

  it("refuses 2001 modifiers", () => {
    const modifiers = manyOf(2_001, (place) => modifierOf("bonus", "unrelated", 1, `Source ${place}`));
    expect(() => workedOut(madeUpRuleCharacter({ modifiers }))).toThrow("The list of modifiers is over the limit of 2000 modifiers.");
  });

  it("takes 500 items", () => {
    const items = manyOf(500, (place) => itemOf(`Item ${place}`, new NotArmour(), 0));
    expect(workedOut(madeUpRuleCharacter({ items })).length).toBeGreaterThan(0);
  });

  it("refuses 501 items", () => {
    const items = manyOf(501, (place) => itemOf(`Item ${place}`, new NotArmour(), 0));
    expect(() => workedOut(madeUpRuleCharacter({ items }))).toThrow("The inventory is over the limit of 500 items.");
  });

  it("refuses 501 features", () => {
    const features = manyOf(501, (place) => `Feature ${place}`);
    expect(() => workedOut(madeUpRuleCharacter({ features }))).toThrow("The list of features is over the limit of 500 features.");
  });

  it("refuses 21 classes", () => {
    const classes = manyOf(21, (place) => classOf(`Class ${place}`, 1, 8));
    expect(() => workedOut(madeUpRuleCharacter({ classes }))).toThrow("The list of classes is over the limit of 20 classes.");
  });
});
