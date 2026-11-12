import { PdfRefusal } from "../refusals/pdf-refusal";
import { MAX_NUMBER_CHARACTERS } from "../limits/pdf-limits";
import { DECIMAL_BASE, ZERO } from "./byte-codes";
import { isDigit } from "./byte-kinds";
import type { ByteCursor } from "./byte-cursor";

export function readDigits(cursor: ByteCursor, what: string): number {
  if (!isDigit(cursor.current())) throw new PdfRefusal(`${what} is missing, so the file was not read.`);
  let value = 0;
  let count = 0;
  while (isDigit(cursor.current())) {
    count += 1;
    if (count > MAX_NUMBER_CHARACTERS) throw new PdfRefusal("A number in the file is too long, so it was not read.");
    value = value * DECIMAL_BASE + (cursor.current() - ZERO);
    cursor.advance();
  }
  if (!Number.isSafeInteger(value)) throw new PdfRefusal("A number in the file is too large, so it was not read.");
  return value;
}

export function readExactDigits(cursor: ByteCursor, count: number, what: string): number {
  let value = 0;
  for (let index = 0; index < count; index += 1) {
    if (!isDigit(cursor.current())) throw new PdfRefusal(`${what} is not written the way PDF writes it, so the file was not read.`);
    value = value * DECIMAL_BASE + (cursor.current() - ZERO);
    cursor.advance();
  }
  return value;
}
