import { describe, expect, it } from "vitest";
import { readIndirectObject } from "../../../src/pdf/file/indirect-object";
import { DirectLengths, type LengthSource } from "../../../src/pdf/file/length-source";
import { AnyId, ExactId } from "../../../src/pdf/file/object-id";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import type { PdfValue } from "../../../src/pdf/values/pdf-value";
import { cursorOver } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

function read(text: string, lengths: LengthSource = new DirectLengths()) {
  return readIndirectObject(cursorOver(text), VALUE_PARSER, new ExactId(5, 0), lengths);
}

class FixedLength implements LengthSource {
  seen: PdfValue | null = null;

  constructor(private readonly length: number) {}

  lengthOf(value: PdfValue): number {
    this.seen = value;
    return this.length;
  }
}

describe("readIndirectObject", () => {
  it("reads the value between obj and endobj", () => {
    const object = read("5 0 obj\n<< /A 1 >>\nendobj");
    expect(object.number).toBe(5);
    expect(object.generation).toBe(0);
    expect(object.value.asDictionary()?.get("A").asInteger()).toBe(1);
  });

  it("reads an object written as tightly as PDF allows", () => {
    expect(read("5 0 obj<</A 1>>endobj").value.asDictionary()).not.toBeNull();
    expect(read("5 0 obj[1]endobj").value.asArray()).not.toBeNull();
  });

  it("reads comments around the value", () => {
    expect(read("5 0 obj %c\n 7 %d\n endobj").value.asInteger()).toBe(7);
  });

  it("refuses an object whose number is not the one expected", () => {
    expect(refusalFrom(() => read("6 0 obj 1 endobj"))).toContain("not where the file's index says it is");
  });

  it("refuses an object whose generation is not the one expected", () => {
    expect(refusalFrom(() => read("5 1 obj 1 endobj"))).toContain("not where the file's index says it is");
  });

  it("takes any number and generation when told to", () => {
    expect(readIndirectObject(cursorOver("77 3 obj 1 endobj"), VALUE_PARSER, new AnyId(), new DirectLengths()).number).toBe(77);
  });

  it.each(["5 0obj 1 endobj", "5obj 0 1 endobj", "50 obj 1 endobj", "5 0 object 1 endobj", " 5 0 obj 1 endobj", "x"])("refuses the header in %j", (text) => {
    expect(refusalFrom(() => read(text))).not.toBe("");
  });

  it.each(["5 0 obj 1", "5 0 obj 1 endob", "5 0 obj 1 endobject", "5 0 obj 1 2 endobj"])("refuses %j, which does not end as an object ends", (text) => {
    expect(refusalFrom(() => read(text))).not.toBe("");
  });

  it("refuses an object cut off before its value", () => {
    expect(refusalFrom(() => read("5 0 obj"))).toContain("not written the way PDF writes it");
  });
});

describe("readIndirectObject with a stream", () => {
  it("reads a stream whose length lands exactly on endstream", () => {
    const object = read("5 0 obj\n<< /Length 4 >>\nstream\nabcd\nendstream\nendobj");
    const stream = object.value.asStream();
    expect(stream?.length).toBe(4);
    expect(stream?.start).toBe("5 0 obj\n<< /Length 4 >>\nstream\n".length);
  });

  it("accepts a carriage return and line feed after the stream keyword", () => {
    const text = "5 0 obj\n<< /Length 4 >>\nstream\r\nabcd\nendstream\nendobj";
    expect(read(text).value.asStream()?.start).toBe(text.indexOf("abcd"));
  });

  it("refuses a carriage return alone after the stream keyword", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 4 >> stream\rabcd\nendstream endobj"))).toContain("does not end the way PDF writes it");
  });

  it("does not read the carriage return as data, even when the length would then fit", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 4 >> stream\rabc\nendstream endobj"))).toContain("does not end the way PDF writes it");
  });

  it("refuses a stream keyword with no line end after it", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 4 >> stream abcd\nendstream endobj"))).toContain("does not end the way PDF writes it");
  });

  it("reads an empty stream", () => {
    expect(read("5 0 obj << /Length 0 >>\nstream\n\nendstream endobj").value.asStream()?.length).toBe(0);
  });

  it("reads a stream with no line end before endstream", () => {
    expect(read("5 0 obj << /Length 4 >>\nstream\nabcdendstream endobj").value.asStream()?.length).toBe(4);
  });

  it("refuses a length that is too short, so endstream is not where it lands", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 2 >>\nstream\nabcd\nendstream endobj"))).toContain("does not end the way PDF writes it");
  });

  it("refuses a length that is too long, so it lands past endstream", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 9 >>\nstream\nabcd\nendstream endobj"))).toContain("does not end the way PDF writes it");
  });

  it("refuses a length that runs past the end of the file", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 999999 >>\nstream\nabcd\nendstream endobj"))).toContain("outside itself");
  });

  it("refuses a stream that has no endstream at all", () => {
    expect(refusalFrom(() => read(`5 0 obj << /Length 4 >>\nstream\nabcd${" ".repeat(50)}`))).toContain("does not end the way PDF writes it");
  });

  it("does not look for endstream in the data, so a fake one inside is read as data", () => {
    const object = read("5 0 obj << /Length 13 >>\nstream\nxendstream\nxx\nendstream endobj");
    expect(object.value.asStream()?.length).toBe(13);
  });

  it("refuses a stream with no length", () => {
    expect(refusalFrom(() => read("5 0 obj << >>\nstream\nabcd\nendstream endobj"))).toContain("does not say its length plainly");
  });

  it("refuses a negative length", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length -1 >>\nstream\nabcd\nendstream endobj"))).toContain("does not say its length plainly");
  });

  it("refuses a length that is not whole", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 4.0 >>\nstream\nabcd\nendstream endobj"))).toContain("does not say its length plainly");
  });

  it("refuses an indirect length when only direct lengths are allowed", () => {
    expect(refusalFrom(() => read("5 0 obj << /Length 9 0 R >>\nstream\nabcd\nendstream endobj"))).toContain("does not say its length plainly");
  });

  it("hands the length entry itself to the length source, so an indirect one can be looked up", () => {
    const lengths = new FixedLength(4);
    read("5 0 obj << /Length 9 0 R >>\nstream\nabcd\nendstream endobj", lengths);
    expect(lengths.seen?.asReference()?.number).toBe(9);
  });

  it("does not take an array followed by the word stream for a stream", () => {
    expect(refusalFrom(() => read("5 0 obj [1] stream\nabcd\nendstream endobj"))).not.toBe("");
  });
});
