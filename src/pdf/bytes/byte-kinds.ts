import {
  CARRIAGE_RETURN,
  FORM_FEED,
  GREATER_THAN,
  LEFT_BRACE,
  LEFT_BRACKET,
  LEFT_PAREN,
  LESS_THAN,
  LINE_FEED,
  NINE,
  NO_BYTE,
  NUL,
  PERCENT,
  RIGHT_BRACE,
  RIGHT_BRACKET,
  RIGHT_PAREN,
  SLASH,
  SPACE,
  TAB,
  ZERO,
  byteOf,
} from "./byte-codes";

const WHITESPACE = new Set([NUL, TAB, LINE_FEED, FORM_FEED, CARRIAGE_RETURN, SPACE]);
const DELIMITERS = new Set([LEFT_PAREN, RIGHT_PAREN, LESS_THAN, GREATER_THAN, LEFT_BRACKET, RIGHT_BRACKET, LEFT_BRACE, RIGHT_BRACE, SLASH, PERCENT]);
const A_UPPER = byteOf("A");
const F_UPPER = byteOf("F");
const A_LOWER = byteOf("a");
const F_LOWER = byteOf("f");

export function isWhitespace(byte: number): boolean {
  return WHITESPACE.has(byte);
}

export function isDelimiter(byte: number): boolean {
  return DELIMITERS.has(byte);
}

export function isRegular(byte: number): boolean {
  return byte !== NO_BYTE && !isWhitespace(byte) && !isDelimiter(byte);
}

export function endsAWord(byte: number): boolean {
  return byte === NO_BYTE || isWhitespace(byte) || isDelimiter(byte);
}

export function isDigit(byte: number): boolean {
  return byte >= ZERO && byte <= NINE;
}

export function isLineEnd(byte: number): boolean {
  return byte === LINE_FEED || byte === CARRIAGE_RETURN;
}

export function hexValueOf(byte: number): number {
  if (isDigit(byte)) return byte - ZERO;
  if (byte >= A_UPPER && byte <= F_UPPER) return byte - A_UPPER + 10;
  if (byte >= A_LOWER && byte <= F_LOWER) return byte - A_LOWER + 10;
  return NO_BYTE;
}
