import type { ObjectStore } from "../file/object-store";
import type { PdfDictionary } from "../values/pdf-dictionary";
import { DOCUMENT_RULES } from "./document-rules";

export function checkedCatalog(trailer: PdfDictionary, store: ObjectStore): PdfDictionary {
  const catalog = store.indirectDictionary(trailer.get("Root"), "This PDF does not say where its contents start, so it was not read.").dictionary;
  for (const rule of DOCUMENT_RULES) rule.check(catalog, store);
  return catalog;
}
