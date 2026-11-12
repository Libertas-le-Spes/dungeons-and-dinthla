import { describe, expect, it } from "vitest";
import { MAX_STRING_BYTES } from "../../../../src/pdf/limits/pdf-limits";
import { PdfString } from "../../../../src/pdf/values/scalars/pdf-string";
import { parsed, refusalFrom } from "../../support/parsed";

function bytesOfString(text: string): number[] {
  const value = parsed(text);
  if (!(value instanceof PdfString)) throw new Error("not a string");
  return [...value.bytes];
}

describe("reading a hex string", () => {
  it("reads pairs of hex digits as bytes", () => {
    expect(bytesOfString("<48656c6C6F>")).toEqual([72, 101, 108, 108, 111]);
  });

  it("ignores whitespace between the digits", () => {
    expect(bytesOfString("<48 65\n6c\t6C\r6F>")).toEqual([72, 101, 108, 108, 111]);
  });

  it("reads an empty hex string", () => {
    expect(bytesOfString("<>")).toEqual([]);
  });

  it("reads a last digit with no partner as if a zero followed it", () => {
    expect(bytesOfString("<4>")).toEqual([64]);
    expect(bytesOfString("<414>")).toEqual([65, 64]);
  });

  it.each(["<4G>", "<zz>", "<48/>", "<48(>"])("refuses the digit that is not hex in %s", (text) => {
    expect(refusalFrom(() => parsed(text))).toContain("A piece of text in the file is not written");
  });

  it("refuses a hex string that never closes", () => {
    expect(refusalFrom(() => parsed("<4142"))).toContain("A piece of text in the file is not written");
  });

  it("reads a string of exactly the longest length", () => {
    expect(bytesOfString(`<${"41".repeat(MAX_STRING_BYTES)}>`).length).toBe(MAX_STRING_BYTES);
  });

  it("refuses a string one byte longer", () => {
    expect(refusalFrom(() => parsed(`<${"41".repeat(MAX_STRING_BYTES + 1)}>`))).toContain("A piece of text in the file is too long");
  });

  it("reads a dictionary, not a hex string, when two angle brackets open", () => {
    expect(parsed("<< /A 1 >>").asDictionary()).not.toBeNull();
  });
});
