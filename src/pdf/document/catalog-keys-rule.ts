import { refuseKeys } from "../refusals/refused-key";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { DocumentRule } from "./document-rule";
import { REFUSED_CATALOG_KEYS } from "./refused-entries";

export class CatalogKeysRule implements DocumentRule {
  check(catalog: PdfDictionary): void {
    refuseKeys(catalog, REFUSED_CATALOG_KEYS);
  }
}
