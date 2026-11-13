import { MAX_XREF_SECTIONS } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { refuseKeys } from "../refusals/refused-key";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { SectionContext } from "./section-reader";
import { SECTION_READERS } from "./section-readers";
import { REFUSED_TRAILER_KEYS } from "./trailer-keys";

const NO_INDEX = "The file's index could not be found where the file says it is, so it was not read.";
const LOOP = "The file's index chain loops back on itself, so it was not read.";
const TOO_LONG = "The file's index has been updated too many times to follow, so it was not read.";

function previousOffsetOf(trailer: PdfDictionary): number | null {
  const previous = trailer.get("Prev");
  if (!previous.isPresent()) return null;
  const offset = previous.asInteger();
  if (offset === null || offset < 0) throw new PdfRefusal(NO_INDEX);
  return offset;
}

async function readSectionAt(context: SectionContext, offset: number): Promise<PdfDictionary> {
  context.cursor.moveTo(offset);
  for (const reader of SECTION_READERS) {
    if (reader.begins(context.cursor)) return reader.read(context);
  }
  throw new PdfRefusal(NO_INDEX);
}

export async function readCrossReferenceChain(context: SectionContext, firstOffset: number): Promise<PdfDictionary> {
  const seen = new Set<number>();
  let newest: PdfDictionary | null = null;
  let offset: number | null = firstOffset;
  while (offset !== null) {
    if (seen.has(offset)) throw new PdfRefusal(LOOP);
    if (seen.size >= MAX_XREF_SECTIONS) throw new PdfRefusal(TOO_LONG);
    seen.add(offset);
    const trailer = await readSectionAt(context, offset);
    refuseKeys(trailer, REFUSED_TRAILER_KEYS);
    if (newest === null) newest = trailer;
    offset = previousOffsetOf(trailer);
  }
  if (newest === null) throw new PdfRefusal(NO_INDEX);
  return newest;
}
