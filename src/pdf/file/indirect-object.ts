import { CARRIAGE_RETURN, LINE_FEED } from "../bytes/byte-codes";
import type { ByteCursor } from "../bytes/byte-cursor";
import { isWhitespace } from "../bytes/byte-kinds";
import { expectWord, hasWord } from "../bytes/expect-word";
import { readDigits } from "../bytes/read-integer";
import { skipSpace, skipWhitespace } from "../bytes/skip-space";
import type { ValueParser } from "../parsing/value-parser";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import { PdfStream } from "../values/pdf-stream";
import type { PdfValue } from "../values/pdf-value";
import type { LengthSource } from "./length-source";
import type { ObjectId } from "./object-id";

const BAD_OBJECT = "An object in the file is not where the file's index says it is, so the file was not read.";
const BAD_END = "An object in the file does not end the way PDF writes it, so the file was not read.";

export interface IndirectObject {
  number: number;
  generation: number;
  value: PdfValue;
}

function expectSpace(cursor: ByteCursor): void {
  if (!isWhitespace(cursor.current())) throw new PdfRefusal(BAD_OBJECT);
  skipWhitespace(cursor);
}

function skipStreamLineBreak(cursor: ByteCursor): void {
  if (cursor.current() === LINE_FEED) {
    cursor.advance();
    return;
  }
  if (cursor.current() === CARRIAGE_RETURN && cursor.peek(1) === LINE_FEED) {
    cursor.advance();
    cursor.advance();
    return;
  }
  throw new PdfRefusal(BAD_END);
}

function readStream(cursor: ByteCursor, dictionary: PdfDictionary, lengths: LengthSource): PdfStream {
  expectWord(cursor, "stream", BAD_END);
  skipStreamLineBreak(cursor);
  const start = cursor.position();
  const length = lengths.lengthOf(dictionary.get("Length"));
  cursor.moveTo(start + length);
  skipWhitespace(cursor);
  expectWord(cursor, "endstream", BAD_END);
  return new PdfStream(dictionary, start, length);
}

function readBody(cursor: ByteCursor, parser: ValueParser, lengths: LengthSource): PdfValue {
  const value = parser.read(cursor, 0);
  skipSpace(cursor);
  const dictionary = value.asDictionary();
  if (dictionary !== null && hasWord(cursor, "stream")) return readStream(cursor, dictionary, lengths);
  return value;
}

export function readIndirectObject(cursor: ByteCursor, parser: ValueParser, expected: ObjectId, lengths: LengthSource): IndirectObject {
  const number = readDigits(cursor, "An object number");
  expectSpace(cursor);
  const generation = readDigits(cursor, "An object's generation");
  expectSpace(cursor);
  expectWord(cursor, "obj", BAD_OBJECT);
  if (!expected.accepts(number, generation)) throw new PdfRefusal(BAD_OBJECT);
  const value = readBody(cursor, parser, lengths);
  skipSpace(cursor);
  expectWord(cursor, "endobj", BAD_END);
  return { number, generation, value };
}
