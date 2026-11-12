import { describe, expect, it } from "vitest";
import { EarlierNumbers } from "../../../../src/beyond/rules/core/earlier-numbers";
import { NeededNumbers } from "../../../../src/beyond/rules/core/needed-numbers";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { NotKnownValue } from "../../../../src/beyond/shape/not-known-value";
import { ROUTE } from "../../builders/made-up-rule-character";

describe("EarlierNumbers", () => {
  it("holds what was added and does not change the one it was added to", () => {
    const empty = EarlierNumbers.none();
    const added = empty.withAll([{ name: "STR", value: KnownValue.wholeNumber(12, "set", ROUTE) }]);
    expect([added.valueOf("STR", ROUTE).valueOr(-1), empty.valueOf("STR", ROUTE).isKnown]).toEqual([12, false]);
  });

  it("says a number that was never worked out has not been, with the route", () => {
    const value = EarlierNumbers.none().valueOf("STR", ROUTE);
    expect([value.isKnown, value.explanation, value.route]).toEqual([false, "STR has not been worked out.", ROUTE]);
  });

  it("lets a later number replace an earlier one of the same name", () => {
    const first = EarlierNumbers.none().withAll([{ name: "STR", value: KnownValue.wholeNumber(1, "a", ROUTE) }]);
    const second = first.withAll([{ name: "STR", value: KnownValue.wholeNumber(2, "b", ROUTE) }]);
    expect(second.valueOf("STR", ROUTE).valueOr(0)).toBe(2);
  });
});

describe("NeededNumbers", () => {
  const earlier = EarlierNumbers.none().withAll([
    { name: "STR", value: KnownValue.wholeNumber(12, "set", ROUTE) },
    { name: "DEX", value: new NotKnownValue("Left blank.", ROUTE) },
  ]);

  it("has nothing missing when every name is known, and gives the numbers", () => {
    const needed = NeededNumbers.of(["STR"], earlier, ROUTE);
    expect([needed.missing, needed.numberOf("STR")]).toEqual([null, 12]);
  });

  it("names the first one that is not known and why", () => {
    const needed = NeededNumbers.of(["STR", "DEX", "CON"], earlier, ROUTE);
    expect(needed.missing?.explanation).toBe("It needs DEX, which is not known: Left blank.");
  });

  it("counts a name that was never worked out as not known", () => {
    expect(NeededNumbers.of(["CON"], earlier, ROUTE).missing?.explanation).toBe("It needs CON, which is not known: CON has not been worked out.");
  });

  it("refuses to hand out a number that is not known, so it cannot be used by mistake", () => {
    expect(() => NeededNumbers.of(["DEX"], earlier, ROUTE).numberOf("DEX")).toThrow("DEX was used before it was known.");
  });
});
