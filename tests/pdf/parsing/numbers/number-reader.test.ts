import { describe, expect, it } from "vitest";
import { MAX_NUMBER_CHARACTERS } from "../../../../src/pdf/limits/pdf-limits";
import { parsed, refusalFrom } from "../../support/parsed";

describe("reading a number", () => {
  it.each([
    ["0", 0],
    ["42", 42],
    ["+7", 7],
    ["-7", -7],
    ["007", 7],
  ])("reads %s as the whole number %s", (text, expected) => {
    expect(parsed(text).asInteger()).toBe(expected);
  });

  it.each(["4.5", "-.5", "4.", ".5", "+0.0"])("reads %s as a number that is not whole", (text) => {
    expect(parsed(text).asInteger()).toBeNull();
    expect(refusalFrom(() => parsed(text))).toBe("");
  });

  it.each(["--5", "1.2.3", "5-", "5x", "12abc", "+", "-", ".", "1e5", "0x10"])("refuses %s", (text) => {
    expect(refusalFrom(() => parsed(text))).toContain("A number in the file is not written");
  });

  it("reads a number of exactly the longest length", () => {
    expect(parsed("0".repeat(MAX_NUMBER_CHARACTERS - 1) + "7").asInteger()).toBe(7);
  });

  it("refuses a number one character longer", () => {
    expect(refusalFrom(() => parsed("0".repeat(MAX_NUMBER_CHARACTERS) + "7"))).toContain("too long");
  });

  it("refuses a whole number that a double cannot hold exactly", () => {
    expect(refusalFrom(() => parsed("99999999999999999999"))).toContain("too long");
    expect(refusalFrom(() => parsed("9007199254740993"))).toContain("too long");
  });

  it("stops a number at a delimiter", () => {
    expect(parsed("12]").asInteger()).toBe(12);
  });
});

describe("reading a reference", () => {
  it("reads two whole numbers and R as a reference", () => {
    const reference = parsed("12 3 R").asReference();
    expect(reference?.number).toBe(12);
    expect(reference?.generation).toBe(3);
  });

  it("reads a reference with a comment and odd whitespace between its parts", () => {
    const reference = parsed("12 %c\n 0\r\nR").asReference();
    expect(reference?.number).toBe(12);
  });

  it("does not read a number followed by another number as a reference", () => {
    const value = parsed("12 3");
    expect(value.asReference()).toBeNull();
    expect(value.asInteger()).toBe(12);
  });

  it("does not read R that runs on into letters as a reference", () => {
    expect(parsed("12 3 Rx").asReference()).toBeNull();
  });

  it("does not read a negative number as the start of a reference", () => {
    expect(parsed("-12 3 R").asReference()).toBeNull();
  });

  it("does not read a number that is not whole as the start of a reference", () => {
    expect(parsed("1.5 3 R").asReference()).toBeNull();
  });

  it("does not read a generation that is not whole as part of a reference", () => {
    expect(parsed("12 3.5 R").asReference()).toBeNull();
  });

  it("leaves the cursor after the number when it is not a reference", () => {
    const list = parsed("[1 2 3 4 R]").asArray();
    expect(list?.items.length).toBe(3);
  });

  it("reads a reference to the largest object number the digits allow", () => {
    expect(parsed("999999999999 0 R").asReference()?.number).toBe(999999999999);
  });
});
