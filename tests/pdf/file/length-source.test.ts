import { describe, expect, it } from "vitest";
import { DirectLengths } from "../../../src/pdf/file/length-source";
import { parsed, refusalFrom } from "../support/parsed";

describe("DirectLengths", () => {
  it("gives a whole length", () => {
    expect(new DirectLengths().lengthOf(parsed("12"))).toBe(12);
    expect(new DirectLengths().lengthOf(parsed("0"))).toBe(0);
  });

  it.each(["-1", "1.5", "/Name", "(5)", "3 0 R", "null"])("refuses %s", (text) => {
    expect(refusalFrom(() => new DirectLengths().lengthOf(parsed(text)))).toContain("does not say its length plainly");
  });
});
