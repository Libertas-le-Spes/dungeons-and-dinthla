import type { ObjectStore } from "../file/object-store";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { refuseKeys } from "../refusals/refused-key";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { DocumentRule } from "./document-rule";
import { REFUSED_NAMES_KEYS } from "./refused-entries";

export class NamesTreeRule implements DocumentRule {
  check(catalog: PdfDictionary, store: ObjectStore): void {
    const entry = catalog.get("Names");
    if (!entry.isPresent()) return;
    const names = store.dictionaryOf(entry);
    if (names === null) throw new PdfRefusal("This PDF's list of named things could not be read, so it was not read.");
    refuseKeys(names, REFUSED_NAMES_KEYS);
  }
}
