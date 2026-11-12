import { HEX_BASE } from "../bytes/byte-codes";
import { ByteSink } from "../bytes/byte-sink";
import { HASH, NO_BYTE, SLASH } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { hexValueOf, isRegular } from "../bytes/byte-kinds";
import { MAX_NAME_BYTES } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { PdfName } from "../values/scalars/pdf-name";
import type { PdfValue } from "../values/pdf-value";
import type { ObjectReader } from "./object-reader";

const TOO_LONG = "A name in the file is too long, so it was not read.";
const BAD_ESCAPE = "A name in the file is not written the way PDF writes it, so the file was not read.";

function readEscapedByte(cursor: ByteCursor): number {
  cursor.advance();
  const high = hexValueOf(cursor.current());
  cursor.advance();
  const low = hexValueOf(cursor.current());
  cursor.advance();
  if (high === NO_BYTE || low === NO_BYTE) throw new PdfRefusal(BAD_ESCAPE);
  const byte = high * HEX_BASE + low;
  if (byte === 0) throw new PdfRefusal(BAD_ESCAPE);
  return byte;
}

function readNameByte(cursor: ByteCursor): number {
  if (cursor.current() === HASH) return readEscapedByte(cursor);
  const byte = cursor.current();
  cursor.advance();
  return byte;
}

export function readName(cursor: ByteCursor): string {
  if (cursor.current() !== SLASH) throw new PdfRefusal(BAD_ESCAPE);
  cursor.advance();
  const sink = new ByteSink(MAX_NAME_BYTES, TOO_LONG);
  while (isRegular(cursor.current())) sink.push(readNameByte(cursor));
  return String.fromCharCode(...sink.toBytes());
}

export class NameReader implements ObjectReader {
  begins(cursor: ByteCursor): boolean {
    return cursor.current() === SLASH;
  }

  read(cursor: ByteCursor): PdfValue {
    return new PdfName(readName(cursor));
  }
}
