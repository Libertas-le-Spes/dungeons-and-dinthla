import { CARRIAGE_RETURN, LINE_FEED, SPACE } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { readExactDigits } from "../bytes/read-integer";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { CLASSIC_ENTRY_KINDS } from "./classic-entry-kinds";
import type { XrefEntry } from "./xref-entry";

export const ENTRY_LINE_BYTES = 20;
const BAD_LINE = "A line of the file's index is not written the way PDF writes it, so the file was not read.";

function expectByte(cursor: ByteCursor, expected: number): void {
  if (cursor.current() !== expected) throw new PdfRefusal(BAD_LINE);
  cursor.advance();
}

function isTwoByteLineEnd(first: number, second: number): boolean {
  if (first === SPACE) return second === CARRIAGE_RETURN || second === LINE_FEED;
  return first === CARRIAGE_RETURN && second === LINE_FEED;
}

function skipLineEnd(cursor: ByteCursor): void {
  if (!isTwoByteLineEnd(cursor.current(), cursor.peek(1))) throw new PdfRefusal(BAD_LINE);
  cursor.advance();
  cursor.advance();
}

export function readClassicEntry(cursor: ByteCursor): XrefEntry {
  const offset = readExactDigits(cursor, 10, "A line of the file's index");
  expectByte(cursor, SPACE);
  const generation = readExactDigits(cursor, 5, "A line of the file's index");
  expectByte(cursor, SPACE);
  const mark = cursor.current();
  cursor.advance();
  skipLineEnd(cursor);
  for (const kind of CLASSIC_ENTRY_KINDS) {
    if (kind.mark === mark) return kind.entryFor(offset, generation, cursor.length());
  }
  throw new PdfRefusal(BAD_LINE);
}
