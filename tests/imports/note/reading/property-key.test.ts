import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { importNameOf } from "../../../../src/imports/note/reading/import-key";
import { MOST_PROPERTY_LINE } from "../../../../src/imports/note/reading/note-limits";
import { continuesAKey, propertyKeyOf } from "../../../../src/imports/note/reading/property-key";

describe("propertyKeyOf", () => {
  it.each([
    ["AC: 12", "AC"],
    ["carried from: x", "carried from"],
    ["AC:", "AC"],
    ["AC : 3", "AC"],
    ["AC:\t3", "AC"],
    ["AC:\r", "AC"],
    ['": 1', '"'],
    ['"AC": 1', "AC"],
    ["'AC': 1", "AC"],
    ['"AC\': 1', "\"AC'"],
  ])("reads the key of %j", (line, key) => {
    expect(propertyKeyOf(line)).toBe(key);
  });

  it.each(["  - item", "\tkey: 1", "- item", "# comment: x", "ACx", "AC:12", ": 1", "", "---", "-a: 1", '"": 1', "  key: 1", "\u00a0x y", "\rx y"])("reads no key from %j", (line) => {
    expect(propertyKeyOf(line)).toBeNull();
  });

  it("reads the key of a line exactly as long as the most it reads", () => {
    const line = `AC: ${"x".repeat(MOST_PROPERTY_LINE - 4)}`;
    expect(propertyKeyOf(line)).toBe("AC");
  });

  it("refuses a line one longer than the most it reads, whatever is in it", () => {
    expect(() => propertyKeyOf(`AC: ${"x".repeat(MOST_PROPERTY_LINE - 3)}`)).toThrow(Refusal);
    expect(() => propertyKeyOf(" ".repeat(MOST_PROPERTY_LINE + 1))).toThrow(`longer than ${MOST_PROPERTY_LINE} characters`);
  });

  it("reads a line of nothing but spaces at the most it reads as no key", () => {
    expect(propertyKeyOf(" ".repeat(MOST_PROPERTY_LINE))).toBeNull();
  });

  it("reads a line of colons without a space after the first as no key", () => {
    expect(propertyKeyOf(":".repeat(MOST_PROPERTY_LINE))).toBeNull();
  });
});

describe("continuesAKey", () => {
  it.each(["  - a", "\tvalue", "- a", "-", "-\t", "-\r"])("takes %j for a line under a key", (line) => {
    expect(continuesAKey(line)).toBe(true);
  });

  it.each(["AC: 1", "-a", "x", ""])("does not take %j for a line under a key", (line) => {
    expect(continuesAKey(line)).toBe(false);
  });
});

describe("importNameOf", () => {
  it.each(["imported", "imported-from", "class", "species", "AC", "HP", "speed", "STR", "DEX", "CON", "INT", "WIS", "CHA"])("knows %s as an import property", (name) => {
    expect(importNameOf(name)).toBe(name);
  });

  it("knows no key from no key", () => {
    expect(importNameOf(null)).toBeNull();
  });

  it("does not know a property of his own", () => {
    expect(importNameOf("mood")).toBeNull();
    expect(importNameOf("AC modifier")).toBeNull();
  });

  it.each([
    ["Speed", "speed"],
    ["ac", "AC"],
    ["Hp", "HP"],
    ["Class", "class"],
    ["IMPORTED", "imported"],
    ["Imported-From", "imported-from"],
  ])("refuses the key %s, which is only %s with other capitals, naming it", (key, name) => {
    expect(() => importNameOf(key)).toThrow(`The note has a property called ${key}, which only differs by capitals from the import's ${name}.`);
  });
});
