import { describe, expect, it } from "vitest";
import { MAX_OBJECTS_PARSED } from "../../../src/pdf/limits/pdf-limits";
import { CompressedEntry } from "../../../src/pdf/xref/entries/compressed-entry";
import { FreeEntry } from "../../../src/pdf/xref/entries/free-entry";
import { InFileEntry } from "../../../src/pdf/xref/entries/in-file-entry";
import type { XrefEntry } from "../../../src/pdf/xref/entries/xref-entry";
import { PdfAbsent } from "../../../src/pdf/values/scalars/pdf-absent";
import { budgetFor } from "../support/cursors";
import { parsed, refusalFrom } from "../support/parsed";
import { present } from "../support/present";
import { opened } from "../support/opened";
import { storeOfObjects, storeOver } from "../support/store-over";
import { PdfWriter } from "../writer/pdf-writer";
import { classicPdf } from "../writer/layouts/classic-layout";

const TEXT = [
  "%PDF-1.7",
  "1 0 obj\n<< /A 1 >>\nendobj",
  "2 0 obj\n3 0 R\nendobj",
  "3 0 obj\n(text)\nendobj",
  "4 0 obj\n<< /Length 5 0 R >>\nstream\nabcd\nendstream\nendobj",
  "5 0 obj\n4\nendobj",
  "6 0 obj\n<< /Length 6 0 R >>\nstream\nabcd\nendstream\nendobj",
  "7 0 obj\n[1 2]\nendobj",
  "8 0 obj\n-3\nendobj",
  "9 0 obj\n/Name\nendobj",
  "",
].join("\n");

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

describe("ObjectStore", () => {
  it("loads an object and gives the same object again without reading it again", () => {
    const store = storeOfObjects(TEXT, NUMBERS);
    expect(store.load(1, 0)).toBe(store.load(1, 0));
    expect(store.load(1, 0).asDictionary()?.get("A").asInteger()).toBe(1);
  });

  it("resolves a reference to the object it names", () => {
    const store = storeOfObjects(TEXT, NUMBERS);
    expect(store.resolve(parsed("3 0 R")).asText()).toBe("text");
  });

  it("gives a value that is not a reference back as it is", () => {
    const store = storeOfObjects(TEXT, NUMBERS);
    const value = parsed("[1]");
    expect(store.resolve(value)).toBe(value);
    expect(store.resolve(PdfAbsent.ABSENT)).toBe(PdfAbsent.ABSENT);
  });

  it("refuses an object that is nothing but a reference", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).load(2, 0))).toContain("point at each other in a circle");
  });

  it("refuses an object the index does not list", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).load(99, 0))).toContain("object that is not there");
  });

  it("refuses a generation that is not the index's", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).load(1, 1))).toContain("object that is not there");
  });

  it("refuses an object the index says was deleted", () => {
    const store = storeOver(TEXT, new Map<number, XrefEntry>([[1, new FreeEntry()]]));
    expect(refusalFrom(() => store.load(1, 0))).toContain("an object it says was deleted");
  });

  it("refuses an object whose place holds another object", () => {
    const store = storeOver(TEXT, new Map<number, XrefEntry>([[1, new InFileEntry(TEXT.indexOf("3 0 obj"), 0)]]));
    expect(refusalFrom(() => store.load(1, 0))).toContain("not where the file's index says it is");
  });

  it("refuses an object whose place is the middle of another object", () => {
    const store = storeOver(TEXT, new Map<number, XrefEntry>([[1, new InFileEntry(TEXT.indexOf("(text)"), 0)]]));
    expect(refusalFrom(() => store.load(1, 0))).toBe("An object number is missing, so the file was not read.");
  });

  it("looks up a stream's length that is written as a reference", () => {
    const stream = storeOfObjects(TEXT, NUMBERS).load(4, 0).asStream();
    expect(stream?.length).toBe(4);
  });

  it("refuses a stream whose length is the stream itself", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).load(6, 0))).toContain("point at each other in a circle");
  });

  it("can load the object again after a refusal, because the loading mark is cleared", () => {
    const store = storeOfObjects(TEXT, NUMBERS);
    refusalFrom(() => store.load(6, 0));
    expect(refusalFrom(() => store.load(6, 0))).toContain("circle");
  });

  it("gives a whole number written directly, or by reference, as a length", () => {
    const store = storeOfObjects(TEXT, NUMBERS);
    expect(store.lengthOf(parsed("7"))).toBe(7);
    expect(store.lengthOf(parsed("5 0 R"))).toBe(4);
  });

  it.each(["8 0 R", "3 0 R", "9 0 R", "7 0 R", "1.5", "/Name"])("refuses %s as a length", (text) => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).lengthOf(parsed(text)))).toContain("does not say its length plainly");
  });

  it("gives the dictionary a reference names, and nothing for something that is not a dictionary", () => {
    const store = storeOfObjects(TEXT, NUMBERS);
    expect(store.dictionaryOf(parsed("1 0 R"))?.has("A")).toBe(true);
    expect(store.dictionaryOf(parsed("3 0 R"))).toBeNull();
    expect(store.dictionaryOf(parsed("<< /B 2 >>"))?.has("B")).toBe(true);
  });

  it("gives the number and dictionary of a reference to a dictionary", () => {
    const found = storeOfObjects(TEXT, NUMBERS).indirectDictionary(parsed("1 0 R"), "refusal words");
    expect(found.number).toBe(1);
    expect(found.dictionary.has("A")).toBe(true);
  });

  it("refuses a dictionary written in place where one that has a number is needed", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).indirectDictionary(parsed("<< /A 1 >>"), "refusal words"))).toBe("refusal words");
  });

  it("refuses a reference to something that is not a dictionary", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).indirectDictionary(parsed("3 0 R"), "refusal words"))).toBe("refusal words");
  });

  it("refuses to read an object packed in a group before the groups have been read", () => {
    expect(refusalFrom(() => storeOfObjects(TEXT, NUMBERS).readCompressed(5, 30, 0))).toContain("itself packed");
  });

  it("refuses a group of packed objects that is itself packed", () => {
    const store = storeOver(TEXT, new Map<number, XrefEntry>([[30, new CompressedEntry(31, 0)]]));
    expect(refusalFrom(() => store.loadContainer(30))).toContain("itself packed");
  });

  it("spends a step each time it is asked for an object, even one it already has", () => {
    const work = budgetFor(TEXT.length);
    const store = storeOfObjects(TEXT, NUMBERS, work);
    store.load(1, 0);
    const before = work.stepsTaken();
    store.load(1, 0);
    store.load(1, 0);
    expect(work.stepsTaken()).toBe(before + 2);
  });
});

function pdfOfObjects(count: number): Buffer {
  const writer = new PdfWriter();
  writer.set(1, "<< /Type /Catalog >>");
  for (let number = 2; number <= count; number += 1) writer.set(number, "[1]");
  return classicPdf(writer);
}

describe("ObjectStore's limit on objects parsed", () => {
  it("parses exactly the most objects allowed, counting each only once", async () => {
    const { store } = await opened(pdfOfObjects(MAX_OBJECTS_PARSED + 5));
    for (let number = 2; number <= MAX_OBJECTS_PARSED; number += 1) store.load(number, 0);
    store.load(2, 0);
    expect(present(store.load(MAX_OBJECTS_PARSED, 0).asArray()).items.length).toBe(1);
  });

  it("refuses the object after that", async () => {
    const { store } = await opened(pdfOfObjects(MAX_OBJECTS_PARSED + 5));
    for (let number = 2; number <= MAX_OBJECTS_PARSED; number += 1) store.load(number, 0);
    expect(refusalFrom(() => store.load(MAX_OBJECTS_PARSED + 1, 0))).toContain("too many objects to read");
  });
});
