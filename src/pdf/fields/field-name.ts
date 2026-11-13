import type { FieldNode } from "./field-node";
import { limitedFieldText } from "./field-text";

export function fullNameOf(node: FieldNode): string {
  return limitedFieldText(node.partialNames().join("."));
}
