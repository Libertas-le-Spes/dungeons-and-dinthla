import { describe, expect, it } from "vitest";
import { readDigits, readExactDigits } from "../../../src/pdf/bytes/read-integer";
import { cursorOver } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

describe("readDigits", () => {
  it("reads the digits and stops at the first byte that is not one", () => {
    const cursor = cursorOver("1234 5");
    expect(readDigits(cursor, "A number")).toBe(1234);
    expect(cursor.position()).toBe(4);
  });

  it("refuses where there is no digit, naming what was wanted", () => {
    expect(refusalFrom(() => readDigits(cursorOver("x"), "The thing wanted"))).toContain("The thing wanted is missing");
  });

  it("refuses a sign", () => {
    expect(refusalFrom(() => readDigits(cursorOver("-5"), "A number"))).toContain("is missing");
  });

  it("reads a number of exactly the longest length", () => {
    expect(readDigits(cursorOver("1".repeat(15)), "A number")).toBe(111111111111111);
  });

  it("refuses a number longer than the longest length", () => {
    expect(refusalFrom(() => readDigits(cursorOver("1".repeat(21)), "A number"))).toContain("too long");
  });

  it("refuses a number that is not exact in a double", () => {
    expect(refusalFrom(() => readDigits(cursorOver("9".repeat(20)), "A number"))).toContain("too large");
  });
});

describe("readExactDigits", () => {
  it("reads exactly the count asked for, with leading zeros", () => {
    const cursor = cursorOver("0000000042x");
    expect(readExactDigits(cursor, 10, "A line")).toBe(42);
    expect(cursor.position()).toBe(10);
  });

  it("refuses when a digit is missing before the count is met", () => {
    expect(refusalFrom(() => readExactDigits(cursorOver("00042 "), 10, "A line"))).toContain("A line is not written the way PDF writes it");
  });

  it("leaves the digit after the count for the caller", () => {
    const cursor = cursorOver("123456");
    expect(readExactDigits(cursor, 5, "A line")).toBe(12345);
    expect(cursor.current()).toBe("6".charCodeAt(0));
  });
});
