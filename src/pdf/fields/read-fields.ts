import type { ObjectStore } from "../file/object-store";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import { FieldActions } from "./field-actions";
import { FieldCollector } from "./field-collector";
import { FieldNodes } from "./field-nodes";
import type { FieldValue } from "./field-value";
import { AcroFormSource } from "./sources/acro-form-source";
import type { FieldSource } from "./sources/field-source";
import { PageWidgetSource } from "./sources/page-widget-source";

function sourceFor(catalog: PdfDictionary, store: ObjectStore, nodes: FieldNodes, collector: FieldCollector): FieldSource {
  const form = catalog.get("AcroForm");
  if (!form.isPresent()) return new PageWidgetSource(catalog, store, nodes, collector);
  const dictionary = store.dictionaryOf(form);
  if (dictionary === null) throw new PdfRefusal("The file's form could not be read, so it was not read.");
  return new AcroFormSource(dictionary, store, nodes, collector);
}

export function readFields(catalog: PdfDictionary, store: ObjectStore): ReadonlyMap<string, FieldValue> {
  const collector = new FieldCollector(store);
  const nodes = new FieldNodes(store, new FieldActions(store));
  sourceFor(catalog, store, nodes, collector).collect();
  if (collector.fieldCount() === 0) throw new PdfRefusal("The file has no form fields to read, so it was not read.");
  return collector.fields();
}
