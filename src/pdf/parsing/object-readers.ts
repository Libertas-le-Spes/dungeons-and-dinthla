import { PdfBoolean } from "../values/scalars/pdf-boolean";
import { PdfNull } from "../values/scalars/pdf-null";
import { ArrayReader } from "./containers/array-reader";
import { DictionaryReader } from "./containers/dictionary-reader";
import { HexStringReader } from "./strings/hex-string-reader";
import { LiteralStringReader } from "./strings/literal-string-reader";
import { NameReader } from "./name-reader";
import { NumberReader } from "./numbers/number-reader";
import type { ObjectReader } from "./object-reader";
import { ValueParser } from "./value-parser";
import { WordReader } from "./word-reader";

const OBJECT_READERS: readonly ObjectReader[] = [
  new DictionaryReader(),
  new HexStringReader(),
  new ArrayReader(),
  new LiteralStringReader(),
  new NameReader(),
  new NumberReader(),
  new WordReader("true", PdfBoolean.TRUE),
  new WordReader("false", PdfBoolean.FALSE),
  new WordReader("null", PdfNull.NULL),
];

export const VALUE_PARSER = new ValueParser(OBJECT_READERS);
