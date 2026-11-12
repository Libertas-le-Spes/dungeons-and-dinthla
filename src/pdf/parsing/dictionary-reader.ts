import { GREATER_THAN, LESS_THAN, SLASH } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { skipSpace } from "../bytes/skip-space";
import { MAX_ITEMS_IN_CONTAINER } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfValue } from "../values/pdf-value";
import { levelInside } from "./nesting";
import { readName } from "./name-reader";
import type { ObjectReader } from "./object-reader";
import type { ValueParser } from "./value-parser";

function endsDictionary(cursor: ByteCursor): boolean {
  return cursor.current() === GREATER_THAN && cursor.peek(1) === GREATER_THAN;
}

function beginsDictionary(cursor: ByteCursor): boolean {
  return cursor.current() === LESS_THAN && cursor.peek(1) === LESS_THAN;
}

function checkRoom(entries: Map<string, PdfValue>, key: string): void {
  if (entries.size >= MAX_ITEMS_IN_CONTAINER) throw new PdfRefusal("A group in the file is too long, so it was not read.");
  if (entries.has(key)) throw new PdfRefusal("A group in the file names the same entry twice, so it was not read.");
}

export class DictionaryReader implements ObjectReader {
  begins(cursor: ByteCursor): boolean {
    return beginsDictionary(cursor);
  }

  read(cursor: ByteCursor, parser: ValueParser, depth: number): PdfValue {
    const level = levelInside(depth);
    cursor.advance();
    cursor.advance();
    const entries = new Map<string, PdfValue>();
    skipSpace(cursor);
    while (!endsDictionary(cursor)) {
      if (cursor.current() !== SLASH) throw new PdfRefusal("A group in the file is not written the way PDF writes it, so the file was not read.");
      const key = readName(cursor);
      checkRoom(entries, key);
      entries.set(key, parser.read(cursor, level));
      skipSpace(cursor);
    }
    cursor.advance();
    cursor.advance();
    return new PdfDictionary(entries);
  }
}
