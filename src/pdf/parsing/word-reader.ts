import type { ByteCursor } from "../bytes/byte-cursor";
import { hasWord, skipWord } from "../bytes/expect-word";
import type { PdfValue } from "../values/pdf-value";
import type { ObjectReader } from "./object-reader";

export class WordReader implements ObjectReader {
  constructor(
    private readonly word: string,
    private readonly value: PdfValue,
  ) {}

  begins(cursor: ByteCursor): boolean {
    return hasWord(cursor, this.word);
  }

  read(cursor: ByteCursor): PdfValue {
    skipWord(cursor, this.word);
    return this.value;
  }
}
