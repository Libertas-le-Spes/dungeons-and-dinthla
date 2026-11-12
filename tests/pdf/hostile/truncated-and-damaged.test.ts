import { describe, expect, it } from "vitest";
import { readPdfFieldsWith, UNEXPECTED_WORDS } from "../../../src/pdf/read-pdf-fields";
import { FormDocument } from "../writer/documents/form-document";
import { firstBytes } from "../support/first-bytes";
import { present } from "../support/present";
import { literal } from "../writer/pdf-text";
import { testParts } from "../writer/zlib-chunks";

const DAMAGE_VALUES = [0x00, 0x09, 0x0a, 0x0d, 0x20, 0x25, 0x28, 0x29, 0x2f, 0x30, 0x39, 0x3c, 0x3e, 0x5b, 0x5d, 0x7f, 0x80, 0xff];

function sheet(): FormDocument {
  return new FormDocument({ acroForm: true }).text("Primary Name", literal("Aria")).check("Primary Flag", "/Yes").choice("Primary Pick", literal("Red"));
}

function endOfStartxref(bytes: Buffer): number {
  const text = bytes.toString("latin1");
  const at = text.lastIndexOf("startxref\n");
  const digits = String(parseInt(present(text.split("startxref\n").pop()), 10)).length;
  return at + "startxref\n".length + digits;
}

function damagedAt(bytes: Buffer, place: number, value: number): Buffer {
  const damaged = Buffer.from(bytes);
  damaged.writeUInt8(value, place);
  return damaged;
}

async function isRealRefusal(bytes: Uint8Array): Promise<boolean> {
  const result = await readPdfFieldsWith(bytes, testParts());
  if (result.ok) return false;
  return result.reason !== UNEXPECTED_WORDS;
}

async function isReadOrRealRefusal(bytes: Uint8Array): Promise<boolean> {
  const result = await readPdfFieldsWith(bytes, testParts());
  if (result.ok) return true;
  return result.reason !== UNEXPECTED_WORDS;
}

class SeededBytes {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 1103515245 + 12345) % 2147483648;
    return Math.floor(this.state / 256) % 256;
  }
}

async function countUnexplained(bytes: Buffer, values: number[]): Promise<number> {
  let unexplained = 0;
  for (let place = 0; place < bytes.length; place += 1) {
    for (const value of values) {
      if (!(await isReadOrRealRefusal(damagedAt(bytes, place, value)))) unexplained += 1;
    }
  }
  return unexplained;
}

describe("a file cut short", () => {
  it.each([
    ["classic", sheet().classic()],
    ["streamed", sheet().streamed()],
  ])("is refused with real words at every length before the end of its startxref number (%s)", async (_shape, bytes) => {
    let notRefused = 0;
    for (let length = 0; length < endOfStartxref(bytes); length += 1) {
      if (!(await isRealRefusal(firstBytes(bytes, length)))) notRefused += 1;
    }
    expect(notRefused).toBe(0);
  });

  it("is read when only the last line after the number is missing, since nothing after the number is read", async () => {
    const bytes = sheet().classic();
    const result = await readPdfFieldsWith(firstBytes(bytes, endOfStartxref(bytes)), testParts());
    expect(result.ok).toBe(true);
  });
});

describe("a file with one byte damaged", () => {
  it("is read, or refused with real words, whichever of eighteen kinds of byte is put at any place (classic)", async () => {
    expect(await countUnexplained(sheet().classic(), DAMAGE_VALUES)).toBe(0);
  });

  it("is read, or refused with real words, whichever kind of byte is put at any place (streamed)", async () => {
    const source = new SeededBytes(5);
    const values = [0x00, 0xff, 0x30, source.next(), source.next(), source.next()];
    expect(await countUnexplained(sheet().streamed(), values)).toBe(0);
  });
});

describe("bytes that are not a PDF at all", () => {
  it("are refused with real words, whatever they are", async () => {
    const source = new SeededBytes(7);
    let notRefused = 0;
    for (let round = 0; round < 300; round += 1) {
      const bytes = Buffer.alloc(source.next() * 8);
      for (let place = 0; place < bytes.length; place += 1) bytes.writeUInt8(source.next(), place);
      if (!(await isRealRefusal(bytes))) notRefused += 1;
    }
    expect(notRefused).toBe(0);
  });

  it("are refused with real words when they begin like a PDF", async () => {
    const source = new SeededBytes(11);
    let notRefused = 0;
    for (let round = 0; round < 300; round += 1) {
      const body = Buffer.alloc(source.next() * 4);
      for (let place = 0; place < body.length; place += 1) body.writeUInt8(source.next(), place);
      const whole = Buffer.concat([Buffer.from("%PDF-1.7\n", "latin1"), body, Buffer.from("\nstartxref\n9\n%%EOF", "latin1")]);
      if (!(await isRealRefusal(whole))) notRefused += 1;
    }
    expect(notRefused).toBe(0);
  });
});
