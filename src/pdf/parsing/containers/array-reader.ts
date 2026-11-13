import { LEFT_BRACKET, RIGHT_BRACKET } from "../../bytes/byte-codes";
import type { ByteCursor } from "../../bytes/byte-cursor";
import { skipSpace } from "../../bytes/skip-space";
import { MAX_ITEMS_IN_CONTAINER } from "../../limits/pdf-limits";
import { PdfRefusal } from "../../refusals/pdf-refusal";
import { PdfArray } from "../../values/pdf-array";
import type { PdfValue } from "../../values/pdf-value";
import { levelInside } from "./nesting";
import type { ObjectReader } from "../object-reader";
import type { ValueParser } from "../value-parser";

export class ArrayReader implements ObjectReader {
  begins(cursor: ByteCursor): boolean {
    return cursor.current() === LEFT_BRACKET;
  }

  read(cursor: ByteCursor, parser: ValueParser, depth: number): PdfValue {
    const level = levelInside(depth);
    cursor.advance();
    const items: PdfValue[] = [];
    skipSpace(cursor);
    while (cursor.current() !== RIGHT_BRACKET) {
      if (items.length >= MAX_ITEMS_IN_CONTAINER) throw new PdfRefusal("A list in the file is too long, so it was not read.");
      items.push(parser.read(cursor, level));
      skipSpace(cursor);
    }
    cursor.advance();
    return new PdfArray(items);
  }
}
