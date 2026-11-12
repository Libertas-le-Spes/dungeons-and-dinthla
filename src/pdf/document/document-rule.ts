import type { ObjectStore } from "../file/object-store";
import type { PdfDictionary } from "../values/pdf-dictionary";

export interface DocumentRule {
  check(catalog: PdfDictionary, store: ObjectStore): void;
}
