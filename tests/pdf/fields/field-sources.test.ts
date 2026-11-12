import { describe, expect, it } from "vitest";
import { MAX_FIELDS, MAX_PAGE_TREE_DEPTH } from "../../../src/pdf/limits/pdf-limits";
import { classicPdf } from "../writer/layouts/classic-layout";
import { FormDocument } from "../writer/documents/form-document";
import { literal } from "../writer/pdf-text";
import { treeDocument, treeWriter } from "../writer/documents/tree-document";
import { fieldsOf, refusalOf } from "../support/read-buffer";

const WIDGET = "/Type /Annot /Subtype /Widget /Rect [0 0 1 1]";

function textField(name: string, value: string): string {
  return `<< ${WIDGET} /FT /Tx /T (${name}) /V (${value}) >>`;
}

describe("finding fields in the form", () => {
  it("reads the fields the form lists, even when no page shows them", async () => {
    const bytes = treeDocument({ objects: { 10: textField("Primary Name", "Aria") }, formFields: [10] });
    expect(await fieldsOf(bytes)).toEqual({ "Primary Name": "Aria" });
  });

  it("reads only the fields the form lists when pages show more", async () => {
    const bytes = treeDocument({ objects: { 10: textField("Listed", "a"), 11: textField("Only on the page", "b") }, formFields: [10], annotations: [10, 11] });
    expect(await fieldsOf(bytes)).toEqual({ Listed: "a" });
  });

  it("reads the form when it is written as an object of its own", async () => {
    const writer = treeWriter({ objects: { 10: textField("Primary Name", "Aria") }, catalogExtra: "/AcroForm 30 0 R" });
    writer.set(30, "<< /Fields [10 0 R] >>");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ "Primary Name": "Aria" });
  });

  it("reads kids that carry names as fields of their own, under their parent's name", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /Kids [11 0 R 12 0 R] >>", 11: textField("One", "a"), 12: textField("Two", "b") },
      formFields: [10],
    });
    expect(await fieldsOf(bytes)).toEqual({ "Top.One": "a", "Top.Two": "b" });
  });

  it("reads kids with no name as the widgets of their parent", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /FT /Tx /V (x) /Kids [11 0 R 12 0 R] >>", 11: `<< ${WIDGET} >>`, 12: `<< ${WIDGET} >>` },
      formFields: [10],
    });
    expect(await fieldsOf(bytes)).toEqual({ Top: "x" });
  });

  it("takes the type and the value from the parent when the field does not state them", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /FT /Tx /V (inherited) /Kids [11 0 R] >>", 11: "<< /T (Leaf) >>" },
      formFields: [10],
    });
    expect(await fieldsOf(bytes)).toEqual({ "Top.Leaf": "inherited" });
  });

  it("prefers the field's own value to the parent's", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /FT /Tx /V (parent) /Kids [11 0 R] >>", 11: "<< /T (Leaf) /V (own) >>" },
      formFields: [10],
    });
    expect(await fieldsOf(bytes)).toEqual({ "Top.Leaf": "own" });
  });

  it("takes the flags from the parent too", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /FT /Btn /Ff 32768 /Kids [11 0 R] >>", 11: "<< /T (Leaf) /V /Second >>" },
      formFields: [10],
    });
    expect(await fieldsOf(bytes)).toEqual({ "Top.Leaf": "Second" });
  });

  it("refuses a field listed under two parents", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (One) /Kids [12 0 R] >>", 11: "<< /T (Two) /Kids [12 0 R] >>", 12: textField("Shared", "a") },
      formFields: [10, 11],
    });
    expect(await refusalOf(bytes)).toContain("nested too deeply, or loop");
  });

  it("refuses a field that lists itself as a kid", async () => {
    const bytes = treeDocument({ objects: { 10: "<< /T (Loop) /Kids [10 0 R] >>" }, formFields: [10] });
    expect(await refusalOf(bytes)).toContain("nested too deeply, or loop");
  });

  it("refuses two fields that list each other as kids", async () => {
    const bytes = treeDocument({ objects: { 10: "<< /T (A) /Kids [11 0 R] >>", 11: "<< /T (B) /Kids [10 0 R] >>" }, formFields: [10] });
    expect(await refusalOf(bytes)).toContain("nested too deeply, or loop");
  });

  it("refuses a field listed twice in the form", async () => {
    const bytes = treeDocument({ objects: { 10: textField("Once", "a") }, formFields: [10, 10] });
    expect(await refusalOf(bytes)).toContain("nested too deeply, or loop");
  });

  it("refuses a form with no field list", async () => {
    const bytes = treeDocument({ catalogExtra: "/AcroForm << >>" });
    expect(await refusalOf(bytes)).toContain("form could not be read");
  });

  it("refuses a form with an empty field list", async () => {
    expect(await refusalOf(treeDocument({ formFields: [] }))).toContain("no form fields to read");
  });

  it("refuses a form that is not a dictionary", async () => {
    expect(await refusalOf(treeDocument({ catalogExtra: "/AcroForm 5" }))).toContain("form could not be read");
  });

  it.each(["/Fields 5", "/Fields << >>"])("refuses a field list written as %s", async (entry) => {
    expect(await refusalOf(treeDocument({ catalogExtra: `/AcroForm << ${entry} >>` }))).toContain("form could not be read");
  });

  it("refuses a field written in place, which has no number", async () => {
    const bytes = treeDocument({ catalogExtra: `/AcroForm << /Fields [<< /T (A) /FT /Tx /V (x) >>] >>` });
    expect(await refusalOf(bytes)).toContain("not a plain object");
  });

  it("refuses a kid written in place", async () => {
    const bytes = treeDocument({ objects: { 10: "<< /T (Top) /Kids [<< /T (A) >>] >>" }, formFields: [10] });
    expect(await refusalOf(bytes)).toContain("not a plain object");
  });

  it("refuses kids that are not a list", async () => {
    const bytes = treeDocument({ objects: { 10: "<< /T (Top) /Kids 5 >>" }, formFields: [10] });
    expect(await refusalOf(bytes)).toContain("not a plain object");
  });
});

describe("finding fields as widgets on the pages", () => {
  it("reads them when the catalogue names no form, as in a real export", async () => {
    expect(await fieldsOf(new FormDocument().text("Primary Name", literal("Aria")).classic())).toEqual({ "Primary Name": "Aria" });
  });

  it("reads fields from every page of a tree of pages", async () => {
    const writer = treeWriter({ objects: { 10: textField("One", "a"), 11: textField("Two", "b"), 12: textField("Three", "c") } });
    writer.set(2, "<< /Type /Pages /Kids [3 0 R 20 0 R] /Count 3 >>");
    writer.set(3, "<< /Type /Page /Parent 2 0 R /Annots [10 0 R] >>");
    writer.set(20, "<< /Type /Pages /Parent 2 0 R /Kids [21 0 R 22 0 R] >>");
    writer.set(21, "<< /Type /Page /Parent 20 0 R /Annots [11 0 R] >>");
    writer.set(22, "<< /Type /Page /Parent 20 0 R /Annots [12 0 R] >>");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ One: "a", Two: "b", Three: "c" });
  });

  it("reads a page that has no annotations", async () => {
    const writer = treeWriter({ objects: { 10: textField("One", "a") }, annotations: [10] });
    writer.set(2, "<< /Type /Pages /Kids [3 0 R 21 0 R] /Count 2 >>");
    writer.set(21, "<< /Type /Page /Parent 2 0 R >>");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ One: "a" });
  });

  it("reads annotations written as an object of their own", async () => {
    const writer = treeWriter({ objects: { 10: textField("One", "a") } });
    writer.set(3, "<< /Type /Page /Parent 2 0 R /Annots 30 0 R >>");
    writer.set(30, "[10 0 R]");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ One: "a" });
  });

  it("reads a widget shown twice once", async () => {
    const bytes = treeDocument({ objects: { 10: textField("One", "a") }, annotations: [10, 10] });
    expect(await fieldsOf(bytes)).toEqual({ One: "a" });
  });

  it("refuses a file with no widgets at all", async () => {
    expect(await refusalOf(treeDocument({}))).toContain("no form fields to read");
  });

  it("refuses a catalogue with no pages", async () => {
    const writer = treeWriter({});
    writer.set(1, "<< /Type /Catalog >>");
    expect(await refusalOf(classicPdf(writer))).toContain("pages could not be read");
  });

  it("refuses pages that list themselves as kids", async () => {
    const writer = treeWriter({});
    writer.set(2, "<< /Type /Pages /Kids [2 0 R] >>");
    expect(await refusalOf(classicPdf(writer))).toContain("pages could not be read");
  });

  it("refuses pages that are not a list of kids", async () => {
    const writer = treeWriter({});
    writer.set(2, "<< /Type /Pages /Kids 5 >>");
    expect(await refusalOf(classicPdf(writer))).toContain("pages could not be read");
  });

  it("refuses annotations that are not a list", async () => {
    const writer = treeWriter({});
    writer.set(3, "<< /Type /Page /Parent 2 0 R /Annots 5 >>");
    expect(await refusalOf(classicPdf(writer))).toContain("not a plain object");
  });

  it("refuses an annotation written in place", async () => {
    const writer = treeWriter({});
    writer.set(3, `<< /Type /Page /Parent 2 0 R /Annots [<< ${WIDGET} /FT /Tx /T (A) /V (x) >>] >>`);
    expect(await refusalOf(classicPdf(writer))).toContain("not a plain object");
  });

  it("reads a tree of pages of exactly the deepest allowed", async () => {
    expect(await fieldsOf(chainOfPages(MAX_PAGE_TREE_DEPTH))).toEqual({ One: "a" });
  });

  it("refuses a tree of pages one deeper", async () => {
    expect(await refusalOf(chainOfPages(MAX_PAGE_TREE_DEPTH + 1))).toContain("pages could not be read");
  });
});

function numberOfLevel(level: number): number {
  if (level === 1) return 2;
  return 100 + level;
}

function chainOfPages(depth: number): Buffer {
  const writer = treeWriter({ objects: { 10: textField("One", "a") } });
  for (let level = 1; level <= depth; level += 1) {
    if (level === depth) writer.set(numberOfLevel(level), `<< /Type /Page /Annots [10 0 R] >>`);
    else writer.set(numberOfLevel(level), `<< /Type /Pages /Kids [${numberOfLevel(level + 1)} 0 R] >>`);
  }
  return classicPdf(writer);
}

describe("the most fields allowed", () => {
  function formOf(count: number): FormDocument {
    const form = new FormDocument();
    for (let index = 0; index < count; index += 1) form.text(`Field ${index}`, literal("v"));
    return form;
  }

  it("reads exactly the most", async () => {
    expect(Object.keys(await fieldsOf(formOf(MAX_FIELDS).classic())).length).toBe(MAX_FIELDS);
  });

  it("refuses one more", async () => {
    expect(await refusalOf(formOf(MAX_FIELDS + 1).classic())).toContain("more form fields than the reader allows");
  });

  it("refuses one more in a form with a field list too", async () => {
    const bytes = new FormDocument({ acroForm: true });
    for (let index = 0; index <= MAX_FIELDS; index += 1) bytes.text(`Field ${index}`, literal("v"));
    expect(await refusalOf(bytes.classic())).toContain("more form fields than the reader allows");
  });

  it("counts fields that have no value too", async () => {
    const form = new FormDocument();
    for (let index = 0; index <= MAX_FIELDS; index += 1) form.text(`Field ${index}`, "");
    expect(await refusalOf(form.classic())).toContain("more form fields than the reader allows");
  });
});
