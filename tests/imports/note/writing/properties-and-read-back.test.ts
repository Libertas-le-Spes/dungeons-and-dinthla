import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { foreignPropertyLinesOf } from "../../../../src/imports/note/writing/foreign-property-lines";
import { outsideTheImport } from "../../../../src/imports/note/writing/outside-the-import";
import { continuesAKey, propertyKeyOf } from "../../../../src/imports/note/writing/property-key";
import { refuseUnlessOnlyTheImportChanged } from "../../../../src/imports/note/writing/read-back";
import { textOf } from "../../builders/line-helpers";

const INVENTORY = "## Inventory (from D&D Beyond)";

describe("propertyKeyOf", () => {
  it.each([
    ["AC: 12", "AC"],
    ["carried from: x", "carried from"],
    ["AC:", "AC"],
    ["AC : 3", "AC"],
  ])("reads the key of %j", (line, key) => {
    expect(propertyKeyOf(line)).toBe(key);
  });

  it.each(["  - item", "- item", "# comment: x", "ACx", "AC:12", '"AC": 1', ": 1", "", "---"])("reads no key from %j", (line) => {
    expect(propertyKeyOf(line)).toBeNull();
  });
});

describe("continuesAKey", () => {
  it.each(["  - a", "\tvalue", "- a", "-"])("takes %j for a line under a key", (line) => {
    expect(continuesAKey(line)).toBe(true);
  });

  it.each(["AC: 1", "-a", "x", ""])("does not take %j for a line under a key", (line) => {
    expect(continuesAKey(line)).toBe(false);
  });
});

describe("foreignPropertyLinesOf", () => {
  it("drops each of the import's properties, whatever the capitals, and keeps the others", () => {
    expect(foreignPropertyLinesOf(["Imported: 2020-01-01", "AC: 1", "ac: 2", "mood: calm", "species: x", "STR: 3"])).toEqual(["mood: calm"]);
  });

  it("drops a list or block under one of the import's properties", () => {
    expect(foreignPropertyLinesOf(["class:", "  - Rogue", "- Monk", "mood: calm"])).toEqual(["mood: calm"]);
  });

  it("keeps a list under a property that is not the import's", () => {
    expect(foreignPropertyLinesOf(["tags:", "  - a", "- b", "AC: 1", "  - c", "mood: calm"])).toEqual(["tags:", "  - a", "- b", "mood: calm"]);
  });

  it("keeps a line that is not a property at all", () => {
    expect(foreignPropertyLinesOf(["# odd", "AC: 1"])).toEqual(["# odd"]);
  });

  it("keeps the line breaks of the lines it keeps", () => {
    expect(foreignPropertyLinesOf(["AC: 1\r", "mood: calm\r"])).toEqual(["mood: calm\r"]);
  });
});

describe("outsideTheImport", () => {
  it("leaves out the import's properties and the properties block's own fences", () => {
    expect(outsideTheImport(textOf("---", "AC: 1", "mood: calm", "---", "body"))).toEqual(["mood: calm", "body"]);
  });

  it("leaves out each plugin section, up to the next big heading", () => {
    expect(outsideTheImport(textOf("top", INVENTORY, "- a", "", "## Mine", "end"))).toEqual(["top", "## Mine", "end"]);
  });

  it("is the same for a note with no properties block as for one with only the import's properties", () => {
    expect(outsideTheImport(textOf("---", "AC: 1", "---", "body"))).toEqual(outsideTheImport("body"));
  });

  it("keeps a Windows line break on the lines it returns", () => {
    expect(outsideTheImport("a\r\nb")).toEqual(["a\r", "b"]);
  });
});

describe("refuseUnlessOnlyTheImportChanged", () => {
  const before = textOf("---", "mood: calm", "---", "His words.", INVENTORY, "- a", "");

  it("lets a change in the import's own properties and sections through", () => {
    const after = textOf("---", "mood: calm", "AC: 5", "---", "His words.", INVENTORY, "- b", "");
    expect(() => refuseUnlessOnlyTheImportChanged(before, after)).not.toThrow();
  });

  it("refuses a changed line of his", () => {
    expect(() => refuseUnlessOnlyTheImportChanged(before, before.replace("His words.", "Other words."))).toThrow(Refusal);
  });

  it("refuses a line of his that was taken out", () => {
    expect(() => refuseUnlessOnlyTheImportChanged(before, before.replace("His words.\n", ""))).toThrow(Refusal);
  });

  it("refuses a line added outside the import", () => {
    expect(() => refuseUnlessOnlyTheImportChanged(before, before.replace("His words.\n", "His words.\nExtra\n"))).toThrow(Refusal);
  });

  it("refuses a property of his that was changed", () => {
    expect(() => refuseUnlessOnlyTheImportChanged(before, before.replace("mood: calm", "mood: angry"))).toThrow(Refusal);
  });

  it("refuses a line break changed on a line of his", () => {
    expect(() => refuseUnlessOnlyTheImportChanged("a\nb", "a\r\nb")).toThrow(Refusal);
  });

  it("says nothing was written", () => {
    expect(() => refuseUnlessOnlyTheImportChanged("a", "b")).toThrow("so nothing was written");
  });
});
