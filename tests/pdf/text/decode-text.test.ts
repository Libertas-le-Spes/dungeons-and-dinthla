import { describe, expect, it } from "vitest";
import { decodeText } from "../../../src/pdf/text/decode-text";
import { refusalFrom } from "../support/parsed";

function bytes(...values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

function utf16(text: string): Uint8Array {
  const units: number[] = [0xfe, 0xff];
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    units.push(Math.floor(unit / 256), unit % 256);
  }
  return Uint8Array.from(units);
}

describe("decodeText in PDFDocEncoding", () => {
  it("reads plain ASCII", () => {
    expect(decodeText(Uint8Array.from(Buffer.from("Primary Name 12", "latin1")))).toBe("Primary Name 12");
  });

  it("reads nothing as an empty string", () => {
    expect(decodeText(bytes())).toBe("");
  });

  it("keeps a tab, a line feed and a carriage return", () => {
    expect(decodeText(bytes(9, 10, 13))).toBe("\t\n\r");
  });

  it("reads the Latin-1 letters above the special range as themselves", () => {
    expect(decodeText(bytes(0xe9, 0xff, 0xa1))).toBe("éÿ¡");
  });

  it.each([
    [0x80, 0x2022],
    [0x84, 0x2014],
    [0x8a, 0x2212],
    [0x92, 0x2122],
    [0x93, 0xfb01],
    [0x9e, 0x017e],
    [0xa0, 0x20ac],
    [0x18, 0x02d8],
    [0x1f, 0x02dc],
  ])("reads the code %s as the character U+%s", (code, point) => {
    expect(decodeText(bytes(code))).toBe(String.fromCharCode(point));
  });

  it.each([0x00, 0x01, 0x08, 0x0b, 0x0c, 0x0e, 0x17, 0x7f, 0x9f, 0xad])("refuses the code %s, which PDFDocEncoding leaves empty", (code) => {
    expect(refusalFrom(() => decodeText(bytes(65, code, 66)))).toContain("text that is not written the way PDF writes it");
  });

  it("reads a lone 0xEF or 0xFE as the letters PDFDocEncoding gives them", () => {
    expect(decodeText(bytes(0xef, 0x41))).toBe("ïA");
    expect(decodeText(bytes(0xfe))).toBe("þ");
  });
});

describe("decodeText in UTF-16", () => {
  it("reads text after the byte order mark", () => {
    expect(decodeText(utf16("Aria é中"))).toBe("Aria é中");
  });

  it("reads only the byte order mark as an empty string", () => {
    expect(decodeText(bytes(0xfe, 0xff))).toBe("");
  });

  it("reads a character outside the basic plane from its pair of halves", () => {
    expect(decodeText(utf16("😀"))).toBe("😀");
  });

  it("keeps a tab, a line feed and a carriage return", () => {
    expect(decodeText(utf16("a\t\n\rb"))).toBe("a\t\n\rb");
  });

  it.each([0x00, 0x01, 0x08, 0x0b, 0x0c, 0x1b, 0x1f, 0x7f, 0x80, 0x85, 0x9f, 0xfdd0, 0xfdef, 0xfffe, 0xffff])("refuses the unit %s, which PDFDocEncoding would refuse too", (unit) => {
    expect(refusalFrom(() => decodeText(utf16(`a${String.fromCharCode(unit)}b`)))).toContain("text that is not written the way PDF writes it");
  });

  it.each([0x20, 0x7e, 0xa0, 0xfdcf, 0xfdf0, 0xfffd, 0x4e2d])("keeps the unit %s", (unit) => {
    expect(decodeText(utf16(String.fromCharCode(unit)))).toBe(String.fromCharCode(unit));
  });

  it("refuses a string that starts with the little-endian byte order mark", () => {
    expect(refusalFrom(() => decodeText(bytes(0xff, 0xfe, 0x41, 0x00)))).toContain("text that is not written the way PDF writes it");
  });

  it("refuses text that stops in the middle of a unit", () => {
    expect(refusalFrom(() => decodeText(bytes(0xfe, 0xff, 0x00)))).toContain("text that is not written the way PDF writes it");
  });

  it.each([
    ["a high half with nothing after it", "\ud83d"],
    ["a low half with nothing before it", "\ude00"],
    ["a high half followed by an ordinary letter", "\ud83dx"],
    ["two high halves", "\ud83d\ud83d"],
    ["a low half before a high half", "\ude00\ud83d"],
  ])("refuses %s", (_what, text) => {
    expect(refusalFrom(() => decodeText(utf16(text)))).toContain("text that is not written the way PDF writes it");
  });
});

describe("decodeText with a UTF-8 mark", () => {
  it("refuses it, because the reader does not read UTF-8", () => {
    expect(refusalFrom(() => decodeText(bytes(0xef, 0xbb, 0xbf, 0x41)))).toContain("text that is not written the way PDF writes it");
  });
});
