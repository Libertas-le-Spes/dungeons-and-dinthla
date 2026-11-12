import { GREATER_THAN, LESS_THAN, NO_BYTE } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { ByteSink } from "../bytes/byte-sink";
import { hexValueOf, isWhitespace } from "../bytes/byte-kinds";
import { MAX_STRING_BYTES } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { PdfString } from "../values/pdf-string";
import type { PdfValue } from "../values/pdf-value";
import type { ObjectReader } from "./object-reader";

const TOO_LONG = "A piece of text in the file is too long, so it was not read.";
const BAD_TEXT = "A piece of text in the file is not written the way PDF writes it, so the file was not read.";

export class HexStringReader implements ObjectReader {
  begins(cursor: ByteCursor): boolean {
    return cursor.current() === LESS_THAN;
  }

  read(cursor: ByteCursor): PdfValue {
    cursor.advance();
    const sink = new ByteSink(MAX_STRING_BYTES, TOO_LONG);
    let high = NO_BYTE;
    while (cursor.current() !== GREATER_THAN) {
      const byte = cursor.current();
      if (isWhitespace(byte)) {
        cursor.advance();
        continue;
      }
      const digit = hexValueOf(byte);
      if (digit === NO_BYTE) throw new PdfRefusal(BAD_TEXT);
      if (high === NO_BYTE) high = digit;
      else {
        sink.push(high * 16 + digit);
        high = NO_BYTE;
      }
      cursor.advance();
    }
    cursor.advance();
    if (high !== NO_BYTE) sink.push(high * 16);
    return new PdfString(sink.toBytes());
  }
}
