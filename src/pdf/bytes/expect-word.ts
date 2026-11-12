import { PdfRefusal } from "../refusals/pdf-refusal";
import type { ByteCursor } from "./byte-cursor";
import { endsAWord } from "./byte-kinds";

export function hasWord(cursor: ByteCursor, word: string): boolean {
  return cursor.startsWith(word) && endsAWord(cursor.peek(word.length));
}

export function skipWord(cursor: ByteCursor, word: string): void {
  for (let index = 0; index < word.length; index += 1) cursor.advance();
}

export function expectWord(cursor: ByteCursor, word: string, refusal: string): void {
  if (!hasWord(cursor, word)) throw new PdfRefusal(refusal);
  skipWord(cursor, word);
}
