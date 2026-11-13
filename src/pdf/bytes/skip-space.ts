import { NO_BYTE, PERCENT } from "./byte-codes";
import { isLineEnd, isWhitespace } from "./byte-kinds";
import type { ByteCursor } from "./byte-cursor";

function skipComment(cursor: ByteCursor): void {
  while (cursor.current() !== NO_BYTE && !isLineEnd(cursor.current())) cursor.advance();
}

function isSkippable(byte: number): boolean {
  return isWhitespace(byte) || byte === PERCENT;
}

export function skipWhitespace(cursor: ByteCursor): void {
  while (isWhitespace(cursor.current())) cursor.advance();
}

export function skipSpace(cursor: ByteCursor): void {
  while (isSkippable(cursor.current())) {
    if (cursor.current() === PERCENT) skipComment(cursor);
    else cursor.advance();
  }
}
