import type { ObjectStore } from "../file/object-store";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfValue } from "../values/pdf-value";
import type { FieldNode } from "./field-node";
import type { FieldValue } from "./field-value";
import { FIELD_KINDS } from "./kinds/field-kinds";
import type { FieldKind } from "./kinds/field-kind";

function kindOf(node: FieldNode, store: ObjectStore): FieldKind | null {
  const typeName = store.resolve(node.inherited("FT")).asName();
  for (const kind of FIELD_KINDS) {
    if (kind.typeName === typeName) return kind;
  }
  return null;
}

function flagsOf(node: FieldNode, store: ObjectStore): number {
  const flags = store.resolve(node.inherited("Ff"));
  if (!flags.isPresent()) return 0;
  const whole = flags.asInteger();
  if (whole === null) throw new PdfRefusal("A field has settings the reader does not understand, so the file was not read.");
  return whole;
}

function resolvedValue(node: FieldNode, store: ObjectStore): PdfValue {
  const value = store.resolve(node.inherited("V"));
  if (value.asStream() !== null) throw new PdfRefusal("A field's value is a stream, which the reader does not read, so the file was not read.");
  return value;
}

export function valueOfField(node: FieldNode, store: ObjectStore): FieldValue | null {
  const kind = kindOf(node, store);
  const value = resolvedValue(node, store);
  if (kind === null || !value.isPresent()) return null;
  return kind.read(value, flagsOf(node, store));
}
