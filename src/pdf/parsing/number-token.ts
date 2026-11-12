import { DOT, MINUS, PLUS } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { endsAWord, isDigit } from "../bytes/byte-kinds";
import { MAX_NUMBER_CHARACTERS } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { PdfNumber } from "../values/pdf-number";

const BAD_NUMBER = "A number in the file is not written the way PDF writes it, so the file was not read.";
const TOO_LONG = "A number in the file is too long, so it was not read.";

export function beginsANumber(byte: number): boolean {
  return isDigit(byte) || byte === PLUS || byte === MINUS || byte === DOT;
}

function isNumberCharacter(byte: number): boolean {
  return isDigit(byte) || byte === DOT;
}

function readSign(cursor: ByteCursor): string {
  const byte = cursor.current();
  if (byte !== PLUS && byte !== MINUS) return "";
  cursor.advance();
  return String.fromCharCode(byte);
}

export function readNumberToken(cursor: ByteCursor): PdfNumber {
  let text = readSign(cursor);
  let dots = 0;
  while (isNumberCharacter(cursor.current())) {
    if (text.length >= MAX_NUMBER_CHARACTERS) throw new PdfRefusal(TOO_LONG);
    if (cursor.current() === DOT) dots += 1;
    text += String.fromCharCode(cursor.current());
    cursor.advance();
  }
  if (!endsAWord(cursor.current())) throw new PdfRefusal(BAD_NUMBER);
  const value = Number(text);
  if (!Number.isFinite(value)) throw new PdfRefusal(BAD_NUMBER);
  if (dots === 0 && !Number.isSafeInteger(value)) throw new PdfRefusal(TOO_LONG);
  return new PdfNumber(value, dots === 0);
}
