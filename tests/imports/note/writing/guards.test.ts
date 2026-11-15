import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { outsideTheImport } from "../../../../src/imports/note/writing/guarding/outside-the-import";
import { refuseUnlessOnlyTheImportChanged } from "../../../../src/imports/note/writing/guarding/read-back";
import { foreignPropertyLinesOf } from "../../../../src/imports/note/writing/rewriting/foreign-property-lines";
import { textOf } from "../../builders/line-helpers";

const INVENTORY = "## Inventory";

describe("foreignPropertyLinesOf", () => {
  it("drops each of the import's properties and keeps the others", () => {
    expect(foreignPropertyLinesOf(["imported: 2020-01-01", "AC: 1", "mood: calm", "species: x", "STR: 3"])).toEqual(["mood: calm"]);
  });

  it("drops a property whose key is quoted", () => {
    expect(foreignPropertyLinesOf(['"AC": 1', "'HP': 2", "mood: calm"])).toEqual(["mood: calm"]);
  });

  it("refuses a key that differs only by capitals from the import's", () => {
    expect(() => foreignPropertyLinesOf(["Imported: 2020-01-01"])).toThrow(Refusal);
    expect(() => foreignPropertyLinesOf(["ac: 2"])).toThrow("only by capitals");
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

  it("drops a property with nothing after its colon in a note with Windows line breaks", () => {
    expect(foreignPropertyLinesOf(["class:\r", "  - Rogue\r", "mood: calm\r"])).toEqual(["mood: calm\r"]);
  });
});

describe("outsideTheImport", () => {
  it("leaves out the import's properties and the properties block's own fences", () => {
    expect(outsideTheImport(textOf("---", "AC: 1", "mood: calm", "---", "body"))).toEqual(["mood: calm", "body"]);
  });

  it("leaves out each plugin section, up to the next big heading, but not the blank line before it", () => {
    expect(outsideTheImport(textOf("top", INVENTORY, "- a", "", "## Mine", "end"))).toEqual(["top", "", "## Mine", "end"]);
  });

  it("is the same for a note with no properties block as for one with only the import's properties", () => {
    expect(outsideTheImport(textOf("---", "AC: 1", "---", "body"))).toEqual(outsideTheImport("body"));
  });

  it("keeps a Windows line break on the lines it returns", () => {
    expect(outsideTheImport("a\r\nb")).toEqual(["a\r", "b"]);
  });

  it("keeps the final empty line of a note whose last section is the import's", () => {
    expect(outsideTheImport(textOf("top", INVENTORY, "- a", ""))).toEqual(["top", ""]);
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

  it("refuses a final empty line taken away", () => {
    expect(() => refuseUnlessOnlyTheImportChanged(before, before.replace("- a\n", "- a"))).toThrow(Refusal);
  });

  it("refuses a property of his that was changed", () => {
    expect(() => refuseUnlessOnlyTheImportChanged(before, before.replace("mood: calm", "mood: angry"))).toThrow(Refusal);
  });

  it("refuses a line break changed on a line of his", () => {
    expect(() => refuseUnlessOnlyTheImportChanged("a\nb", "a\r\nb")).toThrow(Refusal);
  });

  it("refuses a note that grew lines at its end, and one that lost them", () => {
    expect(() => refuseUnlessOnlyTheImportChanged("a", "a\nb")).toThrow(Refusal);
    expect(() => refuseUnlessOnlyTheImportChanged("a\nb", "a")).toThrow(Refusal);
  });

  it("says nothing was written", () => {
    expect(() => refuseUnlessOnlyTheImportChanged("a", "b")).toThrow("so nothing was written");
  });
});
