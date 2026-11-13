import { byteOf } from "../../bytes/byte-codes";
import type { ByteCursor } from "../../bytes/byte-cursor";
import { endsAWord, isDigit } from "../../bytes/byte-kinds";
import { skipSpace } from "../../bytes/skip-space";
import { PdfReference } from "../../values/scalars/pdf-reference";
import type { PdfValue } from "../../values/pdf-value";
import { beginsANumber, readNumberToken } from "./number-token";
import type { ObjectReader } from "../object-reader";

const REFERENCE_MARK = byteOf("R");

function readReferenceTail(cursor: ByteCursor, number: number): PdfReference | null {
  skipSpace(cursor);
  if (!isDigit(cursor.current())) return null;
  const generation = readNumberToken(cursor).asInteger();
  skipSpace(cursor);
  if (generation === null || cursor.current() !== REFERENCE_MARK || !endsAWord(cursor.peek(1))) return null;
  cursor.advance();
  return new PdfReference(number, generation);
}

export class NumberReader implements ObjectReader {
  begins(cursor: ByteCursor): boolean {
    return beginsANumber(cursor.current());
  }

  read(cursor: ByteCursor): PdfValue {
    const number = readNumberToken(cursor);
    const whole = number.asInteger();
    if (whole === null || whole < 0) return number;
    const start = cursor.position();
    const reference = readReferenceTail(cursor, whole);
    if (reference !== null) return reference;
    cursor.moveTo(start);
    return number;
  }
}
