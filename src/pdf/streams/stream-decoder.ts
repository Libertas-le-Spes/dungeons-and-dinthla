import { viewOf } from "../bytes/byte-view";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfStream } from "../values/pdf-stream";
import type { PdfValue } from "../values/pdf-value";
import type { StreamFilter } from "./stream-filter";

const UNKNOWN_FILTER = "A part of the file is compressed in a way the reader does not understand, so it was not read.";

function filterNameOf(filter: PdfValue): string | null {
  if (!filter.isPresent()) return null;
  const array = filter.asArray();
  if (array === null) return nameOrRefuse(filter);
  const only = array.single();
  if (only === null) throw new PdfRefusal(UNKNOWN_FILTER);
  return nameOrRefuse(only);
}

function nameOrRefuse(value: PdfValue): string {
  const name = value.asName();
  if (name === null) throw new PdfRefusal(UNKNOWN_FILTER);
  return name;
}

function parametersOf(dictionary: PdfDictionary): PdfValue {
  return dictionary.get("DecodeParms");
}

export class StreamDecoder {
  constructor(
    private readonly bytes: Uint8Array,
    private readonly origin: number,
    private readonly filters: readonly StreamFilter[],
  ) {}

  async decode(stream: PdfStream, predictorAllowed: boolean): Promise<Uint8Array> {
    const raw = viewOf(this.bytes, this.origin + stream.start, stream.length);
    const name = filterNameOf(stream.dictionary.get("Filter"));
    if (name === null) return raw;
    for (const filter of this.filters) {
      if (filter.named(name)) return filter.decode(raw, parametersOf(stream.dictionary), predictorAllowed);
    }
    throw new PdfRefusal(UNKNOWN_FILTER);
  }
}
