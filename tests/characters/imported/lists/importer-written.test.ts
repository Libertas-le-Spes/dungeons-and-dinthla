import { describe, expect, it } from "vitest";
import { isImporterWritten, MOST_TRACKED_NAME_CHARACTERS } from "../../../../src/characters/imported/lists/importer-written";
import { itemKeyOf, storedItemKeyOf } from "../../../../src/characters/imported/lists/item-key";
import { NAME_LENGTH } from "../../../../src/beyond/shape/import-limits";

describe("a line as the import writes it", () => {
  it("is a plain name, or one with each character the import escapes escaped", () => {
    expect(isImporterWritten("Rope")).toBe(true);
    expect(isImporterWritten("Rope (50 ft) \\*silk\\*")).toBe(true);
  });

  it.each(["Rope #loot", "Bag:: x", "Rope ==mark==", "Rope *silk*", "Rope \\_coil_"])("isn't %s, which the import would have escaped otherwise", function typed(line: string): void {
    expect(isImporterWritten(line)).toBe(false);
  });

  it.each(["Potion\\: Healing", "Spell Scroll\\: Fireball", "\\(Ammo) Arrows", '\\"Lucky" Charm', "\\+1 Dagger", "1\\. Arrows", "\\~Cloak"])(
    "is %s, which the import guarded at the start of the line",
    function guarded(line: string): void {
      expect(isImporterWritten(line)).toBe(true);
    },
  );

  it.each(["Potion: Healing", "(Ammo) Arrows", '"Lucky" Charm', "+1 Dagger", "1. Arrows", "~Cloak"])("isn't %s, whose start the import would have guarded", function typed(line: string): void {
    expect(isImporterWritten(line)).toBe(false);
  });

  it("holds no more characters than the import writes in a name", () => {
    expect(isImporterWritten("é".repeat(MOST_TRACKED_NAME_CHARACTERS))).toBe(true);
    expect(isImporterWritten("é".repeat(MOST_TRACKED_NAME_CHARACTERS + 1))).toBe(false);
  });

  it("is capped at the import's own most name length", () => {
    expect(MOST_TRACKED_NAME_CHARACTERS).toBe(NAME_LENGTH.most);
  });
});

describe("an item's key", () => {
  it("is the same for a name typed at the table and the same name as the import escaped it", () => {
    expect(itemKeyOf("Rope (50 ft) \\*silk\\*")).toBe(storedItemKeyOf("Rope (50 ft) *silk*"));
  });

  it("reads a stored name through its links, as the funds page does", () => {
    expect(storedItemKeyOf("[[Rope]] of  Climbing")).toBe(itemKeyOf("Rope of Climbing"));
  });
});
