import { ByteCursor } from "../bytes/byte-cursor";
import { isDigit } from "../bytes/byte-kinds";
import { readIndirectObject } from "../file/indirect-object";
import { DirectLengths } from "../file/length-source";
import { AnyId } from "../file/object-id";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { SectionContext, SectionReader } from "./section-reader";
import { STREAM_ROW_KINDS } from "./stream-row-kinds";
import { layoutOf, type StreamRowLayout } from "./stream-row-layout";
import type { XrefEntry } from "./xref-entry";

const BAD_STREAM = "The file's index is not written the way PDF writes it, so the file was not read.";
const FILE_KIND = 1;

function readWidth(rows: ByteCursor, width: number): number {
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    value = value * 256 + rows.current();
    rows.advance();
  }
  return value;
}

function entryOfRow(rows: ByteCursor, layout: StreamRowLayout): XrefEntry {
  let kind = FILE_KIND;
  if (layout.kindWidth > 0) kind = readWidth(rows, layout.kindWidth);
  const second = readWidth(rows, layout.secondWidth);
  const third = readWidth(rows, layout.thirdWidth);
  for (const known of STREAM_ROW_KINDS) {
    if (known.typeNumber === kind) return known.entryFor(second, third);
  }
  throw new PdfRefusal(BAD_STREAM);
}

function readRows(context: SectionContext, rows: ByteCursor, layout: StreamRowLayout): void {
  for (const subrange of layout.subranges) {
    context.crossReference.count(subrange.count);
    if (subrange.count * layout.rowBytes > rows.length() - rows.position()) throw new PdfRefusal(BAD_STREAM);
    for (let index = 0; index < subrange.count; index += 1) context.crossReference.addIfNew(subrange.first + index, entryOfRow(rows, layout));
  }
  if (!rows.isAtEnd()) throw new PdfRefusal(BAD_STREAM);
}

export class StreamSectionReader implements SectionReader {
  begins(cursor: ByteCursor): boolean {
    return isDigit(cursor.current());
  }

  async read(context: SectionContext): Promise<PdfDictionary> {
    const object = readIndirectObject(context.cursor, context.parser, new AnyId(), new DirectLengths());
    const stream = object.value.asStream();
    if (stream === null || stream.dictionary.get("Type").asName() !== "XRef") throw new PdfRefusal(BAD_STREAM);
    const layout = layoutOf(stream.dictionary);
    const decoded = await context.decoder.decode(stream, true);
    readRows(context, new ByteCursor(decoded, context.work, 0), layout);
    return stream.dictionary;
  }
}
