import { BACKSLASH, CARRIAGE_RETURN, LEFT_PAREN, LINE_FEED, NO_BYTE, RIGHT_PAREN, SEVEN, ZERO, byteOf } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { ByteSink } from "../bytes/byte-sink";
import { isDigit } from "../bytes/byte-kinds";
import { MAX_STRING_BYTES } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { PdfString } from "../values/pdf-string";
import type { PdfValue } from "../values/pdf-value";
import type { ObjectReader } from "./object-reader";

const TOO_LONG = "A piece of text in the file is too long, so it was not read.";
const BAD_TEXT = "A piece of text in the file is not written the way PDF writes it, so the file was not read.";
const MAX_OCTAL_DIGITS = 3;
const MAX_BYTE = 255;
const SIMPLE_ESCAPES: ReadonlyMap<number, number> = new Map([
  [byteOf("n"), LINE_FEED],
  [byteOf("r"), CARRIAGE_RETURN],
  [byteOf("t"), 9],
  [byteOf("b"), 8],
  [byteOf("f"), 12],
  [LEFT_PAREN, LEFT_PAREN],
  [RIGHT_PAREN, RIGHT_PAREN],
  [BACKSLASH, BACKSLASH],
]);

function isOctalDigit(byte: number): boolean {
  return isDigit(byte) && byte <= SEVEN;
}

function readOctalByte(cursor: ByteCursor): number {
  let value = 0;
  let digits = 0;
  while (digits < MAX_OCTAL_DIGITS && isOctalDigit(cursor.current())) {
    value = value * 8 + (cursor.current() - ZERO);
    digits += 1;
    cursor.advance();
  }
  if (value > MAX_BYTE) throw new PdfRefusal(BAD_TEXT);
  return value;
}

function skipLineBreak(cursor: ByteCursor): void {
  if (cursor.current() === CARRIAGE_RETURN && cursor.peek(1) === LINE_FEED) cursor.advance();
  cursor.advance();
}

function isLineBreak(byte: number): boolean {
  return byte === CARRIAGE_RETURN || byte === LINE_FEED;
}

function readEscape(cursor: ByteCursor, sink: ByteSink): void {
  cursor.advance();
  const byte = cursor.current();
  if (isOctalDigit(byte)) {
    sink.push(readOctalByte(cursor));
    return;
  }
  if (isLineBreak(byte)) {
    skipLineBreak(cursor);
    return;
  }
  const simple = SIMPLE_ESCAPES.get(byte);
  if (simple === undefined) throw new PdfRefusal(BAD_TEXT);
  sink.push(simple);
  cursor.advance();
}

function readLineBreak(cursor: ByteCursor, sink: ByteSink): void {
  skipLineBreak(cursor);
  sink.push(LINE_FEED);
}

export class LiteralStringReader implements ObjectReader {
  begins(cursor: ByteCursor): boolean {
    return cursor.current() === LEFT_PAREN;
  }

  read(cursor: ByteCursor): PdfValue {
    cursor.advance();
    const sink = new ByteSink(MAX_STRING_BYTES, TOO_LONG);
    let open = 1;
    while (open > 0) {
      const byte = cursor.current();
      if (byte === NO_BYTE) throw new PdfRefusal(BAD_TEXT);
      if (byte === BACKSLASH) readEscape(cursor, sink);
      else if (isLineBreak(byte)) readLineBreak(cursor, sink);
      else {
        if (byte === LEFT_PAREN) open += 1;
        if (byte === RIGHT_PAREN) open -= 1;
        if (open > 0) sink.push(byte);
        cursor.advance();
      }
    }
    return new PdfString(sink.toBytes());
  }
}
