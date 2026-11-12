import { DOT } from "../bytes/byte-codes";
import { ByteCursor } from "../bytes/byte-cursor";
import { isDigit } from "../bytes/byte-kinds";
import { HEADER_WINDOW_BYTES } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { WorkBudget } from "../work/work-budget";

const NOT_A_PDF = "This is not a PDF file, so it was not read.";
const MARK = "%PDF-";

function hasVersionAfterMark(cursor: ByteCursor): boolean {
  return isDigit(cursor.peek(MARK.length)) && cursor.peek(MARK.length + 1) === DOT && isDigit(cursor.peek(MARK.length + 2));
}

export function headerPosition(bytes: Uint8Array, work: WorkBudget): number {
  const cursor = new ByteCursor(bytes, work, 0);
  const window = Math.min(HEADER_WINDOW_BYTES, cursor.length());
  while (cursor.position() < window) {
    if (cursor.startsWith(MARK) && hasVersionAfterMark(cursor)) return cursor.position();
    cursor.advance();
  }
  throw new PdfRefusal(NOT_A_PDF);
}
