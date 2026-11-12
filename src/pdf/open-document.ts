import { checkedCatalog } from "./document/catalog";
import { ObjectStore } from "./file/object-store";
import { VALUE_PARSER } from "./parsing/object-readers";
import type { ReaderParts } from "./reader-parts";
import { readFileIndex } from "./read-file-index";
import { ObjectStreams } from "./streams/object-streams";
import type { PdfDictionary } from "./values/pdf-dictionary";
import type { WorkBudget } from "./work/work-budget";

export interface OpenDocument {
  store: ObjectStore;
  catalog: PdfDictionary;
  work: WorkBudget;
}

export async function openDocument(bytes: Uint8Array, parts: ReaderParts): Promise<OpenDocument> {
  const index = await readFileIndex(bytes, parts);
  const store = new ObjectStore(bytes, index.origin, index.work, VALUE_PARSER, index.crossReference);
  const streams = new ObjectStreams(index.decoder, index.work);
  await streams.prepare(store, index.crossReference.containerNumbers());
  store.useObjectStreams(streams);
  return { store, catalog: checkedCatalog(index.trailer, store), work: index.work };
}
