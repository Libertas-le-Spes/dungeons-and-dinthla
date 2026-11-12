import { describe, expect, it } from "vitest";
import { readPdfFieldsWith } from "../../../src/pdf/read-pdf-fields";
import { FormDocument } from "../writer/form-document";
import { literal } from "../writer/pdf-text";
import { testParts } from "../writer/zlib-chunks";

function sheet(): FormDocument {
  return new FormDocument({ acroForm: true }).text("Primary Name", literal("Aria")).check("Primary Flag", "/Yes").choice("Primary Pick", literal("Red"));
}

function endOfStartxref(bytes: Buffer): number {
  const text = bytes.toString("latin1");
  const at = text.lastIndexOf("startxref");
  const number = text.slice(at).split("\n").at(1) ?? "";
  return at + "startxref\n".length + number.length;
}

async function isRefused(bytes: Uint8Array): Promise<boolean> {
  const result = await readPdfFieldsWith(bytes, testParts());
  return !result.ok;
}

class SeededBytes {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 1103515245 + 12345) % 2147483648;
    return this.state % 256;
  }
}

describe("a file cut short", () => {
  it.each([
    ["classic", () => sheet().classic()],
    ["streamed", () => sheet().streamed()],
  ])("is refused at every length before the end of its startxref number (%s)", async (_shape, build) => {
    const bytes = build();
    const refusedLengths: number[] = [];
    const wholeLengths: number[] = [];
    for (let length = 0; length < endOfStartxref(bytes); length += 1) {
      if (await isRefused(Uint8Array.from(bytes.subarray(0, length)))) refusedLengths.push(length);
      else wholeLengths.push(length);
    }
    expect(wholeLengths).toEqual([]);
    expect(refusedLengths.length).toBe(endOfStartxref(bytes));
  });

  it("is read when only the last line after the number is missing, since nothing after the number is read", async () => {
    const bytes = sheet().classic();
    expect(await isRefused(Uint8Array.from(bytes.subarray(0, endOfStartxref(bytes))))).toBe(false);
  });
});

describe("a file with one byte damaged", () => {
  it.each([0x00, 0x20, 0xff, 0x28, 0x3c])("is always answered, never thrown, with the byte %s anywhere (classic)", async (damage) => {
    const bytes = sheet().classic();
    let answered = 0;
    for (let place = 0; place < bytes.length; place += 1) {
      const damaged = Uint8Array.from(bytes);
      damaged.set([damage], place);
      const result = await readPdfFieldsWith(damaged, testParts());
      if (typeof result.ok === "boolean") answered += 1;
    }
    expect(answered).toBe(bytes.length);
  });

  it("is always answered with the byte 0xFF anywhere (streamed)", async () => {
    const bytes = sheet().streamed();
    let answered = 0;
    for (let place = 0; place < bytes.length; place += 1) {
      const damaged = Uint8Array.from(bytes);
      damaged.set([0xff], place);
      const result = await readPdfFieldsWith(damaged, testParts());
      if (typeof result.ok === "boolean") answered += 1;
    }
    expect(answered).toBe(bytes.length);
  });
});

describe("bytes that are not a PDF at all", () => {
  it("are refused, whatever they are", async () => {
    const source = new SeededBytes(7);
    let refused = 0;
    for (let round = 0; round < 300; round += 1) {
      const length = source.next() * 8;
      const bytes = new Uint8Array(length);
      for (let place = 0; place < length; place += 1) bytes.set([source.next()], place);
      if (await isRefused(bytes)) refused += 1;
    }
    expect(refused).toBe(300);
  });

  it("are refused when they begin like a PDF", async () => {
    const source = new SeededBytes(11);
    let refused = 0;
    for (let round = 0; round < 300; round += 1) {
      const body = new Uint8Array(source.next() * 4);
      for (let place = 0; place < body.length; place += 1) body.set([source.next()], place);
      if (await isRefused(Uint8Array.from([...Buffer.from("%PDF-1.7\n", "latin1"), ...body, ...Buffer.from("\nstartxref\n9\n%%EOF", "latin1")]))) refused += 1;
    }
    expect(refused).toBe(300);
  });
});
