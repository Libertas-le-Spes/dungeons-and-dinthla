import { describe, expect, it } from "vitest";
import { MAX_ITEMS_IN_CONTAINER, MAX_NESTING } from "../../../../src/pdf/limits/pdf-limits";
import { parsed, refusalFrom } from "../../support/parsed";

function nestedArrays(depth: number): string {
  return "[".repeat(depth) + "]".repeat(depth);
}

describe("reading an array", () => {
  it("reads values of any kind in order", () => {
    const list = parsed("[1 /Two (three) [4] << /Five 5 >> 6 0 R true null]").asArray();
    expect(list?.items.length).toBe(8);
  });

  it("reads an empty array", () => {
    expect(parsed("[]").asArray()?.items.length).toBe(0);
    expect(parsed("[ \n % nothing\n ]").asArray()?.items.length).toBe(0);
  });

  it("reads items with no whitespace between them where PDF allows it", () => {
    expect(parsed("[/A/B(c)[1]<</E 1>>]").asArray()?.items.length).toBe(5);
  });

  it("reads comments between items", () => {
    expect(parsed("[1%one\n2%two\r3]").asArray()?.items.length).toBe(3);
  });

  it("refuses an array that never closes", () => {
    expect(refusalFrom(() => parsed("[1 2 3"))).toContain("not written the way PDF writes it");
  });

  it("refuses a closing bracket with nothing open", () => {
    expect(refusalFrom(() => parsed("]"))).toContain("not written the way PDF writes it");
  });

  it("reads arrays nested to exactly the deepest allowed level", () => {
    expect(refusalFrom(() => parsed(nestedArrays(MAX_NESTING)))).toBe("");
  });

  it("refuses arrays nested one level deeper", () => {
    expect(refusalFrom(() => parsed(nestedArrays(MAX_NESTING + 1)))).toContain("nests lists or groups too deeply");
  });

  it("holds exactly the most items allowed", () => {
    expect(parsed(`[${"1 ".repeat(MAX_ITEMS_IN_CONTAINER)}]`).asArray()?.items.length).toBe(MAX_ITEMS_IN_CONTAINER);
  });

  it("refuses one item more", () => {
    expect(refusalFrom(() => parsed(`[${"1 ".repeat(MAX_ITEMS_IN_CONTAINER + 1)}]`))).toContain("A list in the file is too long");
  });

  it("gives its only item, and nothing for an array of two or none", () => {
    expect(parsed("[7]").asArray()?.single()?.asInteger()).toBe(7);
    expect(parsed("[7 8]").asArray()?.single()).toBeNull();
    expect(parsed("[]").asArray()?.single()).toBeNull();
  });
});
