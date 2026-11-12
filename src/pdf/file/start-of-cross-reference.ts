import type { ByteCursor } from "../bytes/byte-cursor";
import { readDigits } from "../bytes/read-integer";
import { skipSpace } from "../bytes/skip-space";
import { TRAILER_WINDOW_BYTES } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";

const MARK = "startxref";

function lastMarkPosition(cursor: ByteCursor): number {
  const first = Math.max(0, cursor.length() - TRAILER_WINDOW_BYTES);
  let found = -1;
  cursor.moveTo(first);
  while (!cursor.isAtEnd()) {
    if (cursor.startsWith(MARK)) found = cursor.position();
    cursor.advance();
  }
  return found;
}

export function startOfCrossReference(cursor: ByteCursor): number {
  const mark = lastMarkPosition(cursor);
  if (mark < 0) throw new PdfRefusal("The file has no startxref near its end, so it was not read.");
  cursor.moveTo(mark + MARK.length);
  skipSpace(cursor);
  return readDigits(cursor, "The place the file says its index starts");
}
