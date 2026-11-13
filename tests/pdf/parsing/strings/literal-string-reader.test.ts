import { describe, expect, it } from "vitest";
import { MAX_STRING_BYTES } from "../../../../src/pdf/limits/pdf-limits";
import { PdfString } from "../../../../src/pdf/values/scalars/pdf-string";
import { parsed, refusalFrom } from "../../support/parsed";

function bytesOfString(text: string): number[] {
  const value = parsed(text);
  if (!(value instanceof PdfString)) throw new Error("not a string");
  return [...value.bytes];
}

describe("reading a literal string", () => {
  it("reads the text between the brackets", () => {
    expect(parsed("(Primary Name)").asText()).toBe("Primary Name");
  });

  it("reads an empty string", () => {
    expect(bytesOfString("()")).toEqual([]);
  });

  it("keeps balanced brackets inside", () => {
    expect(parsed("(a (b (c)) d)").asText()).toBe("a (b (c)) d");
  });

  it.each(["(a", "(a (b)", "((((", "(a\\)"])("refuses %s, which never closes", (text) => {
    expect(refusalFrom(() => parsed(text))).toContain("A piece of text in the file is not written");
  });

  it("reads a string that holds a closing bracket only when it is escaped", () => {
    expect(parsed("(a\\)b)").asText()).toBe("a)b");
  });

  it("reads an unbalanced closing bracket as the end of the string", () => {
    expect(parsed("(a))").asText()).toBe("a");
  });

  it.each([
    ["\\n", [10]],
    ["\\r", [13]],
    ["\\t", [9]],
    ["\\b", [8]],
    ["\\f", [12]],
    ["\\(", [40]],
    ["\\)", [41]],
    ["\\\\", [92]],
  ])("reads the escape %s", (escape, expected) => {
    expect(bytesOfString(`(${escape})`)).toEqual(expected);
  });

  it.each([
    ["\\101", [65]],
    ["\\60", [48]],
    ["\\7", [7]],
    ["\\0", [0]],
    ["\\377", [255]],
    ["\\1012", [65, 50]],
    ["\\18", [1, 56]],
  ])("reads the octal escape %s", (escape, expected) => {
    expect(bytesOfString(`(${escape})`)).toEqual(expected);
  });

  it.each(["\\400", "\\777"])("refuses the octal escape %s, which is more than a byte", (escape) => {
    expect(refusalFrom(() => parsed(`(${escape})`))).toContain("A piece of text in the file is not written");
  });

  it.each(["\\q", "\\8", "\\9", "\\ "])("refuses the unknown escape %s", (escape) => {
    expect(refusalFrom(() => parsed(`(${escape})`))).toContain("A piece of text in the file is not written");
  });

  it.each(["(a\\\nb)", "(a\\\rb)", "(a\\\r\nb)"])("joins the lines of %j", (text) => {
    expect(parsed(text).asText()).toBe("ab");
  });

  it.each([
    ["(a\nb)", "a\nb"],
    ["(a\rb)", "a\nb"],
    ["(a\r\nb)", "a\nb"],
  ])("reads a line end inside %j as one line feed", (text, expected) => {
    expect(parsed(text).asText()).toBe(expected);
  });

  it("keeps a NUL byte in the string, for the text step to refuse", () => {
    expect(bytesOfString("(a\0b)")).toEqual([97, 0, 98]);
    expect(refusalFrom(() => parsed("(a\0b)").asText())).toContain("text that is not written the way PDF writes it");
  });

  it("reads a string of exactly the longest length", () => {
    expect(bytesOfString(`(${"a".repeat(MAX_STRING_BYTES)})`).length).toBe(MAX_STRING_BYTES);
  });

  it("refuses a string one byte longer", () => {
    expect(refusalFrom(() => parsed(`(${"a".repeat(MAX_STRING_BYTES + 1)})`))).toContain("A piece of text in the file is too long");
  });

  it("counts the bytes an escape stands for", () => {
    expect(bytesOfString(`(${"\\101".repeat(MAX_STRING_BYTES)})`).length).toBe(MAX_STRING_BYTES);
    expect(refusalFrom(() => parsed(`(${"\\101".repeat(MAX_STRING_BYTES + 1)})`))).toContain("too long");
  });
});
