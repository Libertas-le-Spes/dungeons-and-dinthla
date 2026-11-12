import type { ObjectStore } from "../file/object-store";
import { MAX_FIELDS } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { fullNameOf } from "./field-name";
import type { FieldNode } from "./field-node";
import { valueOfField } from "./field-reading";
import type { FieldValue } from "./field-value";

export class FieldCollector {
  private readonly values = new Map<string, FieldValue>();
  private readonly names = new Set<string>();

  constructor(private readonly store: ObjectStore) {}

  record(terminal: FieldNode): void {
    const name = fullNameOf(terminal);
    if (name === "") return;
    if (this.names.size >= MAX_FIELDS) throw new PdfRefusal("The file has more form fields than the reader allows, so it was not read.");
    if (this.names.has(name)) throw new PdfRefusal("Two form fields in the file share one name, so it was not read.");
    this.names.add(name);
    const value = valueOfField(terminal, this.store);
    if (value !== null) this.values.set(name, value);
  }

  fieldCount(): number {
    return this.names.size;
  }

  fields(): ReadonlyMap<string, FieldValue> {
    return this.values;
  }
}
