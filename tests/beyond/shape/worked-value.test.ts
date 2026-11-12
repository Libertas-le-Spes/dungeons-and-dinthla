import { describe, expect, it } from "vitest";
import { KnownValue } from "../../../src/beyond/shape/known-value";
import { NotKnownValue } from "../../../src/beyond/shape/not-known-value";
import { Online, Pdf } from "../../../src/beyond/shape/route";
import type { WorkedValue } from "../../../src/beyond/shape/worked-value";

describe("a known value", () => {
  it("is known", () => {
    expect(new KnownValue(16, "10 + 4 + 2", new Online()).isKnown).toBe(true);
  });

  it("hands back its value whatever stands in for a missing one", () => {
    const value: WorkedValue<number> = new KnownValue(16, "10 + 4 + 2", new Online());
    expect(value.valueOr(0)).toBe(16);
  });

  it("keeps its working and its route", () => {
    const route = new Pdf();
    const value = new KnownValue(16, "as printed", route);
    expect([value.explanation, value.route]).toEqual(["as printed", route]);
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
