import { describe, expect, it } from "vitest";
import { KnownValue } from "../../../src/beyond/shape/known-value";
import { NotKnownValue } from "../../../src/beyond/shape/not-known-value";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { Online, Pdf } from "../../../src/beyond/shape/route";
import type { WorkedValue } from "../../../src/beyond/shape/worked-value";

describe("a known value", () => {
  it("is known", () => {
    expect(KnownValue.wholeNumber(16, "10 + 4 + 2", new Online()).isKnown).toBe(true);
  });

  it("hands back its value whatever stands in for a missing one", () => {
    const value: WorkedValue<number> = KnownValue.wholeNumber(16, "10 + 4 + 2", new Online());
    expect(value.valueOr(0)).toBe(16);
  });

  it("keeps its working and its route", () => {
    const route = new Pdf();
    const value = KnownValue.wholeNumber(16, "as printed", route);
    expect([value.explanation, value.route]).toEqual(["as printed", route]);
  });
});

describe("a known value made from a number that is not a whole number", () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5, -0])("is refused for %s", (number) => {
    expect(() => KnownValue.wholeNumber(number, "as printed", new Pdf())).toThrow(Refusal);
  });

  it("is made for a whole number, a negative one too", () => {
    expect(KnownValue.wholeNumber(-3, "as printed", new Pdf()).valueOr()).toBe(-3);
  });
});

describe("a value that is not known", () => {
  it("is not known", () => {
    expect(new NotKnownValue("No rule for this.", new Online()).isKnown).toBe(false);
  });

  it("hands back what stands in for it", () => {
    expect(new NotKnownValue("No rule for this.", new Online()).valueOr(7)).toBe(7);
  });

  it("keeps its reason and its route", () => {
    const route = new Pdf();
    const value = new NotKnownValue("No rule for this.", route);
    expect([value.explanation, value.route]).toEqual(["No rule for this.", route]);
  });
});
