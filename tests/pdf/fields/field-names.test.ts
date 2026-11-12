import { describe, expect, it } from "vitest";
import { MAX_FIELD_DEPTH, MAX_FIELD_TEXT_CHARACTERS } from "../../../src/pdf/limits/pdf-limits";
import { treeDocument } from "../writer/tree-document";
import { utf16Hex } from "../writer/pdf-text";
import { fieldsOf, refusalOf } from "../support/read-buffer";

const WIDGET = "/Type /Annot /Subtype /Widget /Rect [0 0 1 1]";

function parentEntry(level: number, number: number): string {
  if (level === 0) return "";
  return `/Parent ${number - 1} 0 R`;
}

function valueEntries(isLast: boolean): string {
  if (!isLast) return "";
  return "/FT /Tx /V (deep)";
}

function chainOfParents(length: number): Buffer {
  const objects: Record<number, string> = {};
  for (let level = 0; level < length; level += 1) {
    const number = 10 + level;
    objects[number] = `<< ${WIDGET} /T (L${level}) ${parentEntry(level, number)} ${valueEntries(level === length - 1)} >>`;
  }
  return treeDocument({ objects, annotations: [9 + length] });
}

describe("a field's full name, found through its parents", () => {
  it("is the partial names joined by dots, from the top down", async () => {
    const bytes = treeDocument({
      objects: {
        10: "<< /T (Top) >>",
        11: `<< /T (Group) /Parent 10 0 R >>`,
        12: `<< ${WIDGET} /FT /Tx /T (Leaf) /V (x) /Parent 11 0 R >>`,
      },
      annotations: [12],
    });
    expect(await fieldsOf(bytes)).toEqual({ "Top.Group.Leaf": "x" });
  });

  it("skips a parent that has no partial name", async () => {
    const bytes = treeDocument({
      objects: {
        10: "<< /T (Top) >>",
        11: "<< /Parent 10 0 R >>",
        12: `<< ${WIDGET} /FT /Tx /T (Leaf) /V (x) /Parent 11 0 R >>`,
      },
      annotations: [12],
    });
    expect(await fieldsOf(bytes)).toEqual({ "Top.Leaf": "x" });
  });

  it("is the parent's name for a widget that has no name of its own", async () => {
    const bytes = treeDocument({
      objects: {
        10: "<< /T (Group) /FT /Tx /V (x) /Kids [11 0 R 12 0 R] >>",
        11: `<< ${WIDGET} /Parent 10 0 R >>`,
        12: `<< ${WIDGET} /Parent 10 0 R >>`,
      },
      annotations: [11, 12],
    });
    expect(await fieldsOf(bytes)).toEqual({ Group: "x" });
  });

  it("is read once for a field that has two widgets", async () => {
    const bytes = treeDocument({
      objects: {
        10: "<< /T (Group) /FT /Tx /V (x) /Kids [11 0 R 12 0 R] >>",
        11: `<< ${WIDGET} /Parent 10 0 R >>`,
        12: `<< ${WIDGET} /Parent 10 0 R >>`,
      },
      annotations: [11, 12],
    });
    expect(Object.keys(await fieldsOf(bytes))).toEqual(["Group"]);
  });

  it("leaves out a widget with no name and no parent", async () => {
    const bytes = treeDocument({
      objects: { 10: `<< ${WIDGET} /FT /Tx /V (lost) >>`, 11: `<< ${WIDGET} /FT /Tx /T (Kept) /V (kept) >>` },
      annotations: [10, 11],
    });
    expect(await fieldsOf(bytes)).toEqual({ Kept: "kept" });
  });

  it("leaves out a field whose name is empty", async () => {
    const bytes = treeDocument({
      objects: { 10: `<< ${WIDGET} /FT /Tx /T () /V (lost) >>`, 11: `<< ${WIDGET} /FT /Tx /T (Kept) /V (kept) >>` },
      annotations: [10, 11],
    });
    expect(await fieldsOf(bytes)).toEqual({ Kept: "kept" });
  });

  it("reads a name written in UTF-16", async () => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /FT /Tx /T ${utf16Hex("Naïve")} /V (x) >>` }, annotations: [10] });
    expect(await fieldsOf(bytes)).toEqual({ "Naïve": "x" });
  });

  it.each(["/T /Name", "/T 5", "/T [(a)]"])("refuses a name written as %s", async (entry) => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /FT /Tx ${entry} /V (x) >>` }, annotations: [10] });
    expect(await refusalOf(bytes)).toContain("name is not text");
  });

  it("refuses a name that is too long", async () => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /FT /Tx /T (${"a".repeat(MAX_FIELD_TEXT_CHARACTERS + 1)}) /V (x) >>` }, annotations: [10] });
    expect(await refusalOf(bytes)).toContain("more text than the reader allows");
  });

  it("refuses two fields that share one full name", async () => {
    const bytes = treeDocument({
      objects: { 10: `<< ${WIDGET} /FT /Tx /T (Same) /V (a) >>`, 11: `<< ${WIDGET} /FT /Tx /T (Same) /V (b) >>` },
      annotations: [10, 11],
    });
    expect(await refusalOf(bytes)).toContain("share one name");
  });

  it("allows one leaf name under two different parents", async () => {
    const bytes = treeDocument({
      objects: {
        10: "<< /T (One) >>",
        11: "<< /T (Two) >>",
        12: `<< ${WIDGET} /FT /Tx /T (Leaf) /V (a) /Parent 10 0 R >>`,
        13: `<< ${WIDGET} /FT /Tx /T (Leaf) /V (b) /Parent 11 0 R >>`,
      },
      annotations: [12, 13],
    });
    expect(await fieldsOf(bytes)).toEqual({ "One.Leaf": "a", "Two.Leaf": "b" });
  });

  it("refuses two fields whose names differ only in how they are written but read the same", async () => {
    const bytes = treeDocument({
      objects: { 10: `<< ${WIDGET} /FT /Tx /T (Name) /V (a) >>`, 11: `<< ${WIDGET} /FT /Tx /T <4E616D65> /V (b) >>` },
      annotations: [10, 11],
    });
    expect(await refusalOf(bytes)).toContain("share one name");
  });
});

describe("the depth of the parents above a widget", () => {
  it("reads a chain of exactly the deepest allowed", async () => {
    expect(Object.keys(await fieldsOf(chainOfParents(MAX_FIELD_DEPTH))).length).toBe(1);
  });

  it("refuses a chain one deeper", async () => {
    expect(await refusalOf(chainOfParents(MAX_FIELD_DEPTH + 1))).toContain("nested too deeply, or loop");
  });

  it("refuses a chain a thousand deep", async () => {
    expect(await refusalOf(chainOfParents(1000))).toContain("nested too deeply, or loop");
  });

  it("refuses two fields that are each other's parent", async () => {
    const bytes = treeDocument({
      objects: { 10: `<< ${WIDGET} /T (A) /Parent 11 0 R >>`, 11: `<< ${WIDGET} /T (B) /Parent 10 0 R >>` },
      annotations: [10],
    });
    expect(await refusalOf(bytes)).toContain("nested too deeply, or loop");
  });

  it("refuses a field that is its own parent", async () => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /T (A) /Parent 10 0 R >>` }, annotations: [10] });
    expect(await refusalOf(bytes)).toContain("nested too deeply, or loop");
  });

  it.each(["/Parent << /T (A) >>", "/Parent 5", "/Parent 11 0 R"])("refuses a parent written as %s", async (entry) => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /T (A) ${entry} >>`, 11: "[1]" }, annotations: [10] });
    expect(await refusalOf(bytes)).toContain("parent that is not a field");
  });
});

describe("the depth of the form's field tree", () => {
  it("reads a chain of exactly the deepest allowed", async () => {
    expect(Object.keys(await fieldsOf(chainOfKids(MAX_FIELD_DEPTH))).length).toBe(1);
  });

  it("refuses a tree one deeper", async () => {
    expect(await refusalOf(chainOfKids(MAX_FIELD_DEPTH + 1))).toContain("nested too deeply, or loop");
  });

  it("refuses a tree a thousand deep", async () => {
    expect(await refusalOf(chainOfKids(1000))).toContain("nested too deeply, or loop");
  });
});

function chainOfKids(length: number): Buffer {
  const objects: Record<number, string> = {};
  for (let level = 0; level < length; level += 1) {
    const number = 10 + level;
    if (level === length - 1) objects[number] = `<< /T (L${level}) /FT /Tx /V (deep) >>`;
    else objects[number] = `<< /T (L${level}) /Kids [${number + 1} 0 R] >>`;
  }
  return treeDocument({ objects, formFields: [10] });
}
