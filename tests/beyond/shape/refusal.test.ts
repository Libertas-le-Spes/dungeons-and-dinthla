import { describe, expect, it } from "vitest";
import { lineBreakInOneLine, overTheLimit, Refusal } from "../../../src/beyond/shape/refusal";

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

describe("lineBreakInOneLine", () => {
  it("says in plain words that a one-line value held a line break", () => {
    expect(lineBreakInOneLine().message).toBe("A value that has to be on one line holds a line break.");
  });

  it("makes a Refusal", () => {
    expect(lineBreakInOneLine()).toBeInstanceOf(Refusal);
  });
});
