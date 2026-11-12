import type { ByteCursor } from "../bytes/byte-cursor";
import { expectWord, hasWord } from "../bytes/expect-word";
import { readDigits } from "../bytes/read-integer";
import { skipSpace, skipWhitespace } from "../bytes/skip-space";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import { ENTRY_LINE_BYTES, readClassicEntry } from "./classic-entry-line";
import type { SectionContext, SectionReader } from "./section-reader";

const BAD_TABLE = "The file's index is not written the way PDF writes it, so the file was not read.";

function readSubsection(context: SectionContext): void {
  const cursor = context.cursor;
  const first = readDigits(cursor, "The first object of a part of the file's index");
  skipWhitespace(cursor);
  const count = readDigits(cursor, "The size of a part of the file's index");
  skipWhitespace(cursor);
  context.crossReference.count(count);
  if (count * ENTRY_LINE_BYTES > cursor.length() - cursor.position()) throw new PdfRefusal(BAD_TABLE);
  for (let index = 0; index < count; index += 1) context.crossReference.addIfNew(first + index, readClassicEntry(cursor));
}

function readTrailer(context: SectionContext): PdfDictionary {
  expectWord(context.cursor, "trailer", BAD_TABLE);
  const trailer = context.parser.read(context.cursor, 0).asDictionary();
  if (trailer === null) throw new PdfRefusal(BAD_TABLE);
  return trailer;
}

function beginsTrailer(cursor: ByteCursor): boolean {
  return hasWord(cursor, "trailer");
}

export class ClassicSectionReader implements SectionReader {
  begins(cursor: ByteCursor): boolean {
    return hasWord(cursor, "xref");
  }

  async read(context: SectionContext): Promise<PdfDictionary> {
    expectWord(context.cursor, "xref", BAD_TABLE);
    skipSpace(context.cursor);
    while (!beginsTrailer(context.cursor)) {
      readSubsection(context);
      skipSpace(context.cursor);
    }
    return readTrailer(context);
  }
}
