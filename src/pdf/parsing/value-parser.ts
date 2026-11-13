import type { ByteCursor } from "../bytes/byte-cursor";
import { skipSpace } from "../bytes/skip-space";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfValue } from "../values/pdf-value";
import type { ObjectReader } from "./object-reader";

export class ValueParser {
  constructor(private readonly readers: readonly ObjectReader[]) {}

  read(cursor: ByteCursor, depth: number): PdfValue {
    skipSpace(cursor);
    cursor.countValue();
    for (const reader of this.readers) {
      if (reader.begins(cursor)) return reader.read(cursor, this, depth);
    }
    throw new PdfRefusal("Something in the file is not written the way PDF writes it, so the file was not read.");
  }
}
