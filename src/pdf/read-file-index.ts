import { ByteCursor } from "./bytes/byte-cursor";
import { headerPosition } from "./file/file-header";
import { startOfCrossReference } from "./file/start-of-cross-reference";
import { MAX_FILE_BYTES } from "./limits/pdf-limits";
import { VALUE_PARSER } from "./parsing/object-readers";
import { PdfRefusal } from "./refusals/pdf-refusal";
import type { ReaderParts } from "./reader-parts";
import { FlateFilter } from "./streams/flate-filter";
import { BoundedInflater } from "./streams/inflate/bounded-inflater";
import { DecompressedTotals } from "./streams/inflate/decompressed-totals";
import { StreamDecoder } from "./streams/stream-decoder";
import type { PdfDictionary } from "./values/pdf-dictionary";
import { WorkBudget } from "./work/work-budget";
import { CrossReference } from "./xref/cross-reference";
import type { SectionContext } from "./xref/section-reader";
import { readCrossReferenceChain } from "./xref/xref-chain";

export interface FileIndex {
  origin: number;
  trailer: PdfDictionary;
  crossReference: CrossReference;
  decoder: StreamDecoder;
  work: WorkBudget;
}

export async function readFileIndex(bytes: Uint8Array, parts: ReaderParts): Promise<FileIndex> {
  if (bytes.byteLength > MAX_FILE_BYTES) throw new PdfRefusal("This file is too big to be a character sheet, so it was not read.");
  const work = new WorkBudget(bytes.byteLength, parts.clock);
  const origin = headerPosition(bytes, work);
  const cursor = new ByteCursor(bytes, work, origin);
  const crossReference = new CrossReference();
  const inflater = new BoundedInflater(parts.startInflating, work, new DecompressedTotals());
  const decoder = new StreamDecoder(bytes, origin, [new FlateFilter(inflater, work)]);
  const context: SectionContext = { cursor, parser: VALUE_PARSER, decoder, work, crossReference };
  const trailer = await readCrossReferenceChain(context, startOfCrossReference(cursor));
  return { origin, trailer, crossReference, decoder, work };
}
