import { describe, expect, it } from "vitest";
import { MAX_OBJECTS_IN_STREAM } from "../../../src/pdf/limits/pdf-limits";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { ObjectStreamContents } from "../../../src/pdf/streams/object-stream-contents";
import { bytesOfText, budgetFor } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

function contentsOf(text: string, count: number, first: number): ObjectStreamContents {
  const bytes = bytesOfText(text);
  return ObjectStreamContents.read(bytes, count, first, budgetFor(bytes.byteLength));
}

function valueAt(contents: ObjectStreamContents, index: number, number: number, size: number) {
  return contents.objectAt(index, number, VALUE_PARSER, budgetFor(size));
}

const TWO = "7 0 9 11 << /A 1 >> [2]";

describe("ObjectStreamContents", () => {
  it("reads each object at its offset after the first", () => {
    const contents = contentsOf(TWO, 2, 9);
    expect(valueAt(contents, 0, 7, 100).asDictionary()?.get("A").asInteger()).toBe(1);
    expect(valueAt(contents, 1, 9, 100).asArray()?.items.length).toBe(1);
  });

  it("reads comments and odd whitespace in the header", () => {
    const text = "7\n%c\n0\r\n9 %d\n 11 << /A 1 >> [2]";
    expect(valueAt(contentsOf(text, 2, text.indexOf("<<")), 1, 9, 100).asArray()).not.toBeNull();
  });

  it("refuses an object asked for by an index with a different number", () => {
    expect(refusalFrom(() => valueAt(contentsOf(TWO, 2, 9), 0, 9, 100))).toContain("not packed the way PDF packs them");
  });

  it("refuses an index past the end", () => {
    expect(refusalFrom(() => valueAt(contentsOf(TWO, 2, 9), 2, 7, 100))).toContain("not packed the way PDF packs them");
  });

  it("refuses an object that starts past the end of the data", () => {
    expect(refusalFrom(() => valueAt(contentsOf("7 999 x", 1, 6), 0, 7, 100))).toContain("outside itself");
  });

  it("refuses a first offset past the end of the data", () => {
    expect(refusalFrom(() => valueAt(contentsOf("7 0 1", 1, 999), 0, 7, 100))).toContain("outside itself");
  });

  it("refuses a number named twice in the header", () => {
    expect(refusalFrom(() => contentsOf("7 0 7 3 1 2", 2, 8))).toContain("not packed the way PDF packs them");
  });

  it("refuses a header shorter than its count says", () => {
    expect(refusalFrom(() => contentsOf("7 0", 2, 3))).toContain("is missing");
  });

  it("refuses a header with something that is not a number", () => {
    expect(refusalFrom(() => contentsOf("7 /A", 1, 4))).toContain("is missing");
  });

  it("reads a header of exactly the most objects allowed", () => {
    let header = "";
    for (let number = 1; number <= MAX_OBJECTS_IN_STREAM; number += 1) header += `${number} ${number} `;
    expect(refusalFrom(() => contentsOf(`${header}1`, MAX_OBJECTS_IN_STREAM, header.length))).toBe("");
  });

  it("refuses a count one more than that, before reading the header", () => {
    expect(refusalFrom(() => contentsOf("", MAX_OBJECTS_IN_STREAM + 1, 0))).toContain("holds too many objects");
  });

  it("refuses two header entries at the same offset", () => {
    expect(refusalFrom(() => contentsOf("7 0 9 0 [2]", 2, 8))).toContain("not packed the way PDF packs them");
  });

  it("refuses offsets that go backwards", () => {
    expect(refusalFrom(() => contentsOf("7 5 9 0 [2] [3]", 2, 8))).toContain("not packed the way PDF packs them");
  });

  it("refuses an object that runs into the next object's place", () => {
    const contents = contentsOf("7 0 9 2 [1 2 3] [4]", 2, 8);
    expect(refusalFrom(() => valueAt(contents, 0, 7, 100))).toContain("not packed the way PDF packs them");
  });

  it("reads an object that ends exactly where the next one starts", () => {
    const contents = contentsOf("7 0 9 3 [1] [4]", 2, 8);
    expect(valueAt(contents, 0, 7, 100).asArray()?.items.length).toBe(1);
  });

  it("reads thousands of small objects, each at its own place", () => {
    let header = "";
    let bodies = "";
    for (let number = 1; number <= 5000; number += 1) {
      header += `${number} ${bodies.length} `;
      bodies += "7 ";
    }
    const contents = contentsOf(header + bodies, 5000, header.length);
    expect(valueAt(contents, 4999, 5000, 100000).asInteger()).toBe(7);
  });

  it("reads an object whose value starts at the first offset itself", () => {
    expect(valueAt(contentsOf("7 0 5", 1, 4), 0, 7, 100).asInteger()).toBe(5);
  });
});
