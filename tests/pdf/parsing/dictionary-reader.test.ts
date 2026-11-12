import { describe, expect, it } from "vitest";
import { MAX_ITEMS_IN_CONTAINER, MAX_NESTING } from "../../../src/pdf/limits/pdf-limits";
import { parsed, refusalFrom } from "../support/parsed";

function nestedDictionaries(depth: number): string {
  return "<< /A ".repeat(depth) + "1" + " >>".repeat(depth);
}

describe("reading a dictionary", () => {
  it("reads entries by name", () => {
    const dictionary = parsed("<< /Type /Catalog /Count 3 /Kids [1 0 R] >>").asDictionary();
    expect(dictionary?.get("Type").asName()).toBe("Catalog");
    expect(dictionary?.get("Count").asInteger()).toBe(3);
    expect(dictionary?.get("Kids").asArray()?.items.length).toBe(1);
  });

  it("reads an empty dictionary", () => {
    expect(parsed("<<>>").asDictionary()?.has("A")).toBe(false);
  });

  it("gives an absent value for a name that is not there", () => {
    expect(parsed("<< /A 1 >>").asDictionary()?.get("B").isPresent()).toBe(false);
  });

  it("keeps a null entry, which reads as not present", () => {
    const dictionary = parsed("<< /A null >>").asDictionary();
    expect(dictionary?.has("A")).toBe(true);
    expect(dictionary?.get("A").isPresent()).toBe(false);
  });

  it("reads entries with no whitespace where PDF allows it", () => {
    expect(parsed("<</A/B/C(d)/E[1]/F<</G 1>>>>").asDictionary()?.get("A").asName()).toBe("B");
  });

  it("reads comments between entries", () => {
    expect(parsed("<< /A %c\n 1 %d\n /B 2 >>").asDictionary()?.get("B").asInteger()).toBe(2);
  });

  it("refuses a name written twice", () => {
    expect(refusalFrom(() => parsed("<< /A 1 /A 2 >>"))).toContain("names the same entry twice");
  });

  it("treats names that differ only by an escape as the same name", () => {
    expect(refusalFrom(() => parsed("<< /A 1 /#41 2 >>"))).toContain("names the same entry twice");
  });

  it.each(["<< /A 1", "<< /A", "<< /A 1 >", "<< /A 1 > >"])("refuses %s, which never closes", (text) => {
    expect(refusalFrom(() => parsed(text))).toContain("not written the way PDF writes it");
  });

  it.each(["<< 1 2 >>", "<< (a) 1 >>", "<< /A 1 2 >>"])("refuses %s, whose entries are not name and value", (text) => {
    expect(refusalFrom(() => parsed(text))).toContain("A group in the file is not written");
  });

  it("refuses a name with no value", () => {
    expect(refusalFrom(() => parsed("<< /A >>"))).toContain("not written the way PDF writes it");
  });

  it("reads dictionaries nested to exactly the deepest allowed level", () => {
    expect(refusalFrom(() => parsed(nestedDictionaries(MAX_NESTING)))).toBe("");
  });

  it("refuses dictionaries nested one level deeper", () => {
    expect(refusalFrom(() => parsed(nestedDictionaries(MAX_NESTING + 1)))).toContain("nests lists or groups too deeply");
  });

  it("counts arrays and dictionaries together toward the nesting", () => {
    const mixed = "[<<  /A ".repeat(MAX_NESTING / 2) + "1" + " >>]".repeat(MAX_NESTING / 2);
    expect(refusalFrom(() => parsed(mixed))).toBe("");
    expect(refusalFrom(() => parsed(`[${mixed}]`))).toContain("nests lists or groups too deeply");
  });

  it("holds exactly the most entries allowed", () => {
    let text = "<<";
    for (let index = 0; index < MAX_ITEMS_IN_CONTAINER; index += 1) text += ` /K${index} 1`;
    expect(refusalFrom(() => parsed(`${text} >>`))).toBe("");
  });

  it("refuses one entry more", () => {
    let text = "<<";
    for (let index = 0; index <= MAX_ITEMS_IN_CONTAINER; index += 1) text += ` /K${index} 1`;
    expect(refusalFrom(() => parsed(`${text} >>`))).toContain("A group in the file is too long");
  });

  it("is not an array or a string", () => {
    const dictionary = parsed("<< >>");
    expect(dictionary.asArray()).toBeNull();
    expect(dictionary.asText()).toBeNull();
  });
});
