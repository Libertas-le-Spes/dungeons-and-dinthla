import { describe, expect, it } from "vitest";
import { overTheLimit, Refusal } from "../../../src/beyond/shape/refusal";

describe("overTheLimit", () => {
  it("says what was too big and what the limit is, in plain words", () => {
    const cap = { what: "The inventory", most: 500, unit: "items" };
    expect(overTheLimit(cap).message).toBe("The inventory is over the limit of 500 items.");
  });

  it("makes a Refusal that is an error", () => {
    const refusal = overTheLimit({ what: "A name", most: 1, unit: "characters" });
    expect(refusal).toBeInstanceOf(Refusal);
    expect(refusal).toBeInstanceOf(Error);
  });
});
