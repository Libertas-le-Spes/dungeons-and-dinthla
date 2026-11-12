import type { ByteCursor } from "../bytes/byte-cursor";
import type { PdfValue } from "../values/pdf-value";
import type { ValueParser } from "./value-parser";

export interface ObjectReader {
  begins(cursor: ByteCursor): boolean;
  read(cursor: ByteCursor, parser: ValueParser, depth: number): PdfValue;
}
