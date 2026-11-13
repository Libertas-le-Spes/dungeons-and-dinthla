import { describe, expect, it } from "vitest";
import { notKnownCharacter } from "../builders/not-known-character";

describe("a character whose numbers are all not known (a check that the shape can hold them)", () => {
  it("can hold a level that is not known", () => {
    expect(notKnownCharacter().classes.map((each) => each.level.isKnown)).toEqual([false]);
  });

  it("can hold every ability score as not known", () => {
    const scores = Object.values(notKnownCharacter().scores);
    expect(scores).toHaveLength(6);
    expect(scores.map((score) => score.isKnown)).toEqual([false, false, false, false, false, false]);
  });

  it("can hold a number that is not known, with its reason", () => {
    expect(notKnownCharacter().numbers.map((each) => each.value.explanation)).toEqual(["Left blank on the sheet."]);
  });

  it("can hold an item count that is not known", () => {
    expect(notKnownCharacter().inventory.map((item) => item.count.isKnown)).toEqual([false]);
  });

  it("can hold every coin as not known", () => {
    const coins = Object.values(notKnownCharacter().purse);
    expect(coins).toHaveLength(5);
    expect(coins.map((coin) => coin.isKnown)).toEqual([false, false, false, false, false]);
  });
});
