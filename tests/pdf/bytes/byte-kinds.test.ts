import { describe, expect, it } from "vitest";
import { byteOf, NO_BYTE } from "../../../src/pdf/bytes/byte-codes";
import { endsAWord, hexValueOf, isDelimiter, isDigit, isLineEnd, isRegular, isWhitespace } from "../../../src/pdf/bytes/byte-kinds";

const WHITESPACE = [0, 9, 10, 12, 13, 32];
const DELIMITERS = ["(", ")", "<", ">", "[", "]", "{", "}", "/", "%"];

describe("byte kinds", () => {
  it.each(WHITESPACE)("calls %s whitespace", (byte) => {
    expect(isWhitespace(byte)).toBe(true);
    expect(isRegular(byte)).toBe(false);
  });

  it.each([11, 160, 65, NO_BYTE])("does not call %s whitespace", (byte) => {
    expect(isWhitespace(byte)).toBe(false);
  });

  it.each(DELIMITERS)("calls %s a delimiter", (character) => {
    expect(isDelimiter(byteOf(character))).toBe(true);
    expect(isRegular(byteOf(character))).toBe(false);
    expect(endsAWord(byteOf(character))).toBe(true);
  });

  it("calls letters, digits and signs regular", () => {
    for (const character of ["a", "Z", "0", "-", "#", "."]) expect(isRegular(byteOf(character))).toBe(true);
  });

  it("calls the end of the file the end of a word, but not a regular byte", () => {
    expect(endsAWord(NO_BYTE)).toBe(true);
    expect(isRegular(NO_BYTE)).toBe(false);
  });

  it("calls only 0 to 9 digits", () => {
    expect(isDigit(byteOf("0"))).toBe(true);
    expect(isDigit(byteOf("9"))).toBe(true);
    expect(isDigit(byteOf("/"))).toBe(false);
    expect(isDigit(byteOf(":"))).toBe(false);
  });

  it("calls only the line feed and the carriage return line ends", () => {
    expect(isLineEnd(10)).toBe(true);
    expect(isLineEnd(13)).toBe(true);
    expect(isLineEnd(32)).toBe(false);
  });

  it.each([
    ["0", 0],
    ["9", 9],
    ["a", 10],
    ["F", 15],
    ["f", 15],
    ["A", 10],
  ])("reads %s as the hex digit %s", (character, value) => {
    expect(hexValueOf(byteOf(character))).toBe(value);
  });

  it.each(["g", "G", "/", ":", "@", "`"])("reads %s as no hex digit", (character) => {
    expect(hexValueOf(byteOf(character))).toBe(NO_BYTE);
  });
});
