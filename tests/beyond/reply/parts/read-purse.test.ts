import { describe, expect, it } from "vitest";
import { purseOf } from "../../../../src/beyond/reply/parts/read-purse";
import type { Purse } from "../../../../src/beyond/shape/purse";
import { MadeUpReply } from "../../builders/made-up-reply";

const COINS: { key: string; coin: keyof Purse; label: string; value: number }[] = [
  { key: "pp", coin: "platinum", label: "Platinum", value: 1 },
  { key: "gp", coin: "gold", label: "Gold", value: 15 },
  { key: "ep", coin: "electrum", label: "Electrum", value: 0 },
  { key: "sp", coin: "silver", label: "Silver", value: 4 },
  { key: "cp", coin: "copper", label: "Copper", value: 5 },
];

describe("purseOf", () => {
  it.each(COINS)("reads $key as $coin with the working", ({ coin, label, value }) => {
    const found = purseOf(MadeUpReply.levelOneMonk().reader())[coin];
    expect(found.valueOr(-1)).toBe(value);
    expect(found.explanation).toBe(`${label}: ${value}`);
  });

  it.each(COINS)("marks only $coin not known when $key is missing", ({ key, coin }) => {
    const found = purseOf(MadeUpReply.levelOneMonk().without(["currencies", key]).reader());
    expect(found[coin].isKnown).toBe(false);
    expect(found[coin].explanation).toBe("A coin count is missing or is not a number.");
    const others = COINS.filter((other) => other.coin !== coin);
    expect(others.map((other) => found[other.coin].isKnown)).toEqual(Array(4).fill(true));
  });

  it.each(["5", null, true, [5], 2.5, -1, 1_000_001, Infinity])("marks the coin count %j not known", (value) => {
    expect(purseOf(MadeUpReply.levelOneMonk().with(["currencies", "gp"], value).reader()).gold.isKnown).toBe(false);
  });

  it.each([0, 1_000_000])("takes the coin count %i at the edge of the range", (value) => {
    expect(purseOf(MadeUpReply.levelOneMonk().with(["currencies", "gp"], value).reader()).gold.valueOr(-1)).toBe(value);
  });

  it("refuses missing currencies", () => {
    expect(() => purseOf(MadeUpReply.levelOneMonk().without(["currencies"]).reader())).toThrow('"currencies" is missing or is not an object');
  });

  it.each([[], [{ gp: 1 }], "gp", 5, null])("refuses currencies given as %j", (value) => {
    expect(() => purseOf(MadeUpReply.levelOneMonk().with(["currencies"], value).reader())).toThrow("not an object");
  });
});
