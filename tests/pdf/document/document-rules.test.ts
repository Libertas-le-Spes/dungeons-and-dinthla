import { describe, expect, it } from "vitest";
import { classicPdf } from "../writer/classic-layout";
import { FormDocument } from "../writer/form-document";
import { literal } from "../writer/pdf-text";
import { fieldsOf, refusalOf } from "../support/read-buffer";

const FILES = "carries files inside it";

function plain(): FormDocument {
  return new FormDocument().text("Primary Name", literal("Aria"));
}

describe("what refuses the whole file, in the catalogue", () => {
  it.each([
    ["an open action that runs a script", "/OpenAction << /S /JavaScript /JS (app.alert(1)) >>", "does something when it is opened"],
    ["an open action that is a destination", "/OpenAction [3 0 R /Fit]", "does something when it is opened"],
    ["an open action that is a reference", "/OpenAction 3 0 R", "does something when it is opened"],
    ["an open action that is null, because the entry is there", "/OpenAction null", "does something when it is opened"],
    ["additional actions for the document", "/AA << /WC << /S /JavaScript /JS (x) >> >>", "runs actions for the whole document"],
    ["associated files", "/AF [20 0 R]", FILES],
  ])("%s", async (_what, extra, words) => {
    expect(await refusalOf(new FormDocument({ catalogExtra: extra }).text("Primary Name", literal("Aria")).classic())).toContain(words);
  });

  it("a script in the names tree, written in place", async () => {
    const bytes = new FormDocument({ catalogExtra: "/Names << /JavaScript << /Names [(init) 20 0 R] >> >>" }).text("Primary Name", literal("Aria")).classic();
    expect(await refusalOf(bytes)).toContain("script for the whole document");
  });

  it("a script in the names tree, written as an object of its own", async () => {
    const doc = new FormDocument({ catalogExtra: "/Names 30 0 R" }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, "<< /JavaScript << /Names [] >> >>");
    expect(await refusalOf(classicPdf(writer))).toContain("script for the whole document");
  });

  it("an empty script entry in the names tree, because the entry is there", async () => {
    const bytes = new FormDocument({ catalogExtra: "/Names << /JavaScript null >>" }).text("Primary Name", literal("Aria")).classic();
    expect(await refusalOf(bytes)).toContain("script for the whole document");
  });

  it("embedded files in the names tree", async () => {
    const bytes = new FormDocument({ catalogExtra: "/Names << /EmbeddedFiles << /Names [] >> >>" }).text("Primary Name", literal("Aria")).classic();
    expect(await refusalOf(bytes)).toContain(FILES);
  });

  it("a names tree that is not a dictionary", async () => {
    expect(await refusalOf(new FormDocument({ catalogExtra: "/Names 5" }).text("Primary Name", literal("Aria")).classic())).toContain("list of named things could not be read");
  });

  it("a names tree that points at nothing", async () => {
    expect(await refusalOf(new FormDocument({ catalogExtra: "/Names 99 0 R" }).text("Primary Name", literal("Aria")).classic())).toContain("object that is not there");
  });

  it("a catalogue that is not where the trailer says", async () => {
    expect(await refusalOf(plain().classic({ root: 2 }))).not.toBe("");
  });

  it("a trailer with no /Root", async () => {
    const bytes = plain().classic().toString("latin1").replace("/Root 1 0 R", "/Marker 1");
    expect(await refusalOf(Buffer.from(bytes, "latin1"))).toContain("does not say where its contents start");
  });

  it("a /Root that is not a reference", async () => {
    const bytes = plain().classic().toString("latin1").replace("/Root 1 0 R", "/Root << /Type /Catalog >>");
    expect(await refusalOf(Buffer.from(bytes, "latin1"))).toContain("does not say where its contents start");
  });

  it("a /Root that is not a dictionary", async () => {
    const doc = plain();
    const writer = doc.writer();
    writer.set(1, "[1 2]");
    expect(await refusalOf(classicPdf(writer))).toContain("does not say where its contents start");
  });
});

describe("what the catalogue may hold without refusing the file", () => {
  it("names that hold neither scripts nor files", async () => {
    const bytes = new FormDocument({ catalogExtra: "/Names << /Dests << /Names [] >> >> /Lang (en)" }).text("Primary Name", literal("Aria")).classic();
    expect(await fieldsOf(bytes)).toEqual({ "Primary Name": "Aria" });
  });

  it("a version, language and viewer preferences", async () => {
    const bytes = new FormDocument({ catalogExtra: "/Version /1.7 /Lang (en) /ViewerPreferences << /HideToolbar true >>" }).text("Primary Name", literal("Aria")).classic();
    expect(await fieldsOf(bytes)).toEqual({ "Primary Name": "Aria" });
  });
});

describe("what refuses the whole file, in the form and on the pages", () => {
  it("an XFA entry in the form", async () => {
    const bytes = new FormDocument({ acroForm: true, formExtra: "/XFA [(template) 20 0 R]" }).text("Primary Name", literal("Aria")).classic();
    expect(await refusalOf(bytes)).toContain("second copy of its form");
  });

  it("additional actions on a page", async () => {
    const bytes = new FormDocument({ pageExtra: "/AA << /O << /S /JavaScript /JS (x) >> >>" }).text("Primary Name", literal("Aria")).classic();
    expect(await refusalOf(bytes)).toContain("runs actions when a page opens");
  });

  it.each(["FileAttachment", "RichMedia", "Screen", "Movie", "Sound", "3D"])("an annotation of the kind %s", async (kind) => {
    const doc = new FormDocument({ extraAnnotations: [30] }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, `<< /Type /Annot /Subtype /${kind} /Rect [0 0 1 1] >>`);
    expect(await refusalOf(classicPdf(writer))).toMatch(/carries (files inside it|embedded media)/);
  });

  it.each([
    ["a link with a web address", "/A << /S /URI /URI (http://example.test) >>"],
    ["a link with a script", "/A << /S /JavaScript /JS (x) >>"],
    ["a link with a go-to action", "/A << /S /GoTo /D [3 0 R /Fit] >>"],
    ["a link with additional actions", "/AA << /E << /S /GoTo >> >>"],
  ])("%s, which is not a form field", async (_what, entry) => {
    const doc = new FormDocument({ extraAnnotations: [30] }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, `<< /Type /Annot /Subtype /Link /Rect [0 0 1 1] ${entry} >>`);
    expect(await refusalOf(classicPdf(writer))).toContain("not a form field");
  });

  it("a link that only names a destination is read past", async () => {
    const doc = new FormDocument({ extraAnnotations: [30] }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, "<< /Type /Annot /Subtype /Link /Rect [0 0 1 1] /Dest [3 0 R /Fit] >>");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ "Primary Name": "Aria" });
  });

  it("a note annotation with no action is read past", async () => {
    const doc = new FormDocument({ extraAnnotations: [30] }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, "<< /Type /Annot /Subtype /Text /Rect [0 0 1 1] /Contents (hello) >>");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ "Primary Name": "Aria" });
  });

  it("an annotation with no kind, which is not a form field", async () => {
    const doc = new FormDocument({ extraAnnotations: [30] }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, "<< /Type /Annot /A << /S /URI >> >>");
    expect(await refusalOf(classicPdf(writer))).toContain("not a form field");
  });

  it("a link on a page that the form's field list does not lead to, because that page is not read", async () => {
    const doc = new FormDocument({ acroForm: true, extraAnnotations: [30] }).text("Primary Name", literal("Aria"));
    const writer = doc.writer();
    writer.set(30, "<< /Type /Annot /Subtype /Link /Rect [0 0 1 1] /A << /S /URI /URI (http://example.test) >> >>");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ "Primary Name": "Aria" });
  });
});
