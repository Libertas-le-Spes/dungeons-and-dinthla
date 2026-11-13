import { describe, expect, it } from "vitest";
import { readPdfFieldsWith, UNEXPECTED_WORDS } from "../../../src/pdf/read-pdf-fields";
import { FormDocument } from "../writer/documents/form-document";
import { firstBytes } from "../support/first-bytes";
import { present } from "../support/present";
import { literal } from "../writer/pdf-text";
import { testParts } from "../writer/zlib-chunks";

const DAMAGE_VALUES = [0x00, 0x09, 0x0a, 0x0d, 0x20, 0x25, 0x28, 0x29, 0x2f, 0x30, 0x39, 0x3c, 0x3e, 0x5b, 0x5d, 0x7f, 0x80, 0xff];
const RANDOM_ROUNDS = 300;

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

async function unexplainedValuesAt(bytes: Buffer, place: number, values: number[]): Promise<number[]> {
  const unexplained: number[] = [];
  for (const value of values) {
    if (!(await isReadOrRealRefusal(damagedAt(bytes, place, value)))) unexplained.push(value);
  }
  return unexplained;
}

function placesIn(bytes: Buffer): number[] {
  const places: number[] = [];
  for (let place = 0; place < bytes.length; place += 1) places.push(place);
  return places;
}

function cutsBefore(shape: string, bytes: Buffer): { shape: string; bytes: Buffer; length: number }[] {
  const cuts: { shape: string; bytes: Buffer; length: number }[] = [];
  for (let length = 0; length < endOfStartxref(bytes); length += 1) cuts.push({ shape, bytes, length });
  return cuts;
}

function randomBytes(source: SeededBytes, length: number): Buffer {
  const bytes = Buffer.alloc(length);
  for (let place = 0; place < bytes.length; place += 1) bytes.writeUInt8(source.next(), place);
  return bytes;
}

function notPdfFiles(): { round: number; bytes: Buffer }[] {
  const source = new SeededBytes(7);
  const files: { round: number; bytes: Buffer }[] = [];
  for (let round = 0; round < RANDOM_ROUNDS; round += 1) files.push({ round, bytes: randomBytes(source, source.next() * 8) });
  return files;
}

function pdfLookingFiles(): { round: number; bytes: Buffer }[] {
  const source = new SeededBytes(11);
  const files: { round: number; bytes: Buffer }[] = [];
  for (let round = 0; round < RANDOM_ROUNDS; round += 1) {
    const body = randomBytes(source, source.next() * 4);
    const whole = Buffer.concat([Buffer.from("%PDF-1.7\n", "latin1"), body, Buffer.from("\nstartxref\n9\n%%EOF", "latin1")]);
    files.push({ round, bytes: whole });
  }
  return files;
}

function streamedDamageValues(): number[] {
  const source = new SeededBytes(5);
  return [0x00, 0xff, 0x30, source.next(), source.next(), source.next()];
}

const CLASSIC = sheet().classic();
const STREAMED = sheet().streamed();
const STREAMED_DAMAGE_VALUES = streamedDamageValues();

describe("a file cut short", () => {
  it.each([...cutsBefore("classic", CLASSIC), ...cutsBefore("streamed", STREAMED)])(
    "is refused with real words when cut to $length bytes, before the end of its startxref number ($shape)",
    async ({ bytes, length }) => {
      expect(await isRealRefusal(firstBytes(bytes, length))).toBe(true);
    },
  );

  it("is read when only the last line after the number is missing, since nothing after the number is read", async () => {
    const result = await readPdfFieldsWith(firstBytes(CLASSIC, endOfStartxref(CLASSIC)), testParts());
    expect(result.ok).toBe(true);
  });
});

describe("a file with one byte damaged", () => {
  it.each(placesIn(CLASSIC))("is read, or refused with real words, whichever of eighteen kinds of byte is put at place %i (classic)", async (place) => {
    expect(await unexplainedValuesAt(CLASSIC, place, DAMAGE_VALUES)).toEqual([]);
  });

  it.each(placesIn(STREAMED))("is read, or refused with real words, whichever kind of byte is put at place %i (streamed)", async (place) => {
    expect(await unexplainedValuesAt(STREAMED, place, STREAMED_DAMAGE_VALUES)).toEqual([]);
  });
});

describe("bytes that are not a PDF at all", () => {
  it.each(notPdfFiles())("are refused with real words, whatever they are (round $round)", async ({ bytes }) => {
    expect(await isRealRefusal(bytes)).toBe(true);
  });

  it.each(pdfLookingFiles())("are refused with real words when they begin like a PDF (round $round)", async ({ bytes }) => {
    expect(await isRealRefusal(bytes)).toBe(true);
  });
});
