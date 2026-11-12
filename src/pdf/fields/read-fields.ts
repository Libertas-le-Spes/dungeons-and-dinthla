import type { ObjectStore } from "../file/object-store";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import { FieldActions } from "./field-actions";
import { FieldCollector } from "./field-collector";
import { FieldNodes } from "./field-nodes";
import type { FieldValue } from "./field-value";
import { AcroFormSource } from "./sources/acro-form-source";
import { CheckingWidgets } from "./sources/checking-widgets";
import { CollectingWidgets } from "./sources/collecting-widgets";
import type { FieldSource } from "./sources/field-source";
import { PageWalk } from "./sources/page-walk";

function sourcesFor(catalog: PdfDictionary, store: ObjectStore, nodes: FieldNodes, collector: FieldCollector): FieldSource[] {
  const form = catalog.get("AcroForm");
  if (!form.isPresent()) return [new PageWalk(catalog, store, new CollectingWidgets(nodes, collector))];
  const dictionary = store.dictionaryOf(form);
  if (dictionary === null) throw new PdfRefusal("The file's form could not be read, so it was not read.");
  return [new AcroFormSource(dictionary, store, nodes, collector), new PageWalk(catalog, store, new CheckingWidgets(nodes))];
}

export function readFields(catalog: PdfDictionary, store: ObjectStore): ReadonlyMap<string, FieldValue> {
  const collector = new FieldCollector(store);
  const nodes = new FieldNodes(store, new FieldActions(store));
  for (const source of sourcesFor(catalog, store, nodes, collector)) source.collect();
  if (collector.fieldCount() === 0) throw new PdfRefusal("The file has no form fields to read, so it was not read.");
  return collector.fields();
}
