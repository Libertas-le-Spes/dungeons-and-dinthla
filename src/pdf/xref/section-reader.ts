import type { ByteCursor } from "../bytes/byte-cursor";
import type { ValueParser } from "../parsing/value-parser";
import type { StreamDecoder } from "../streams/stream-decoder";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { WorkBudget } from "../work/work-budget";
import type { CrossReference } from "./cross-reference";

export interface SectionContext {
  cursor: ByteCursor;
  parser: ValueParser;
  decoder: StreamDecoder;
  work: WorkBudget;
  crossReference: CrossReference;
}

export interface SectionReader {
  begins(cursor: ByteCursor): boolean;
  read(context: SectionContext): Promise<PdfDictionary>;
}
