import type { ImportedClass } from "../../../../beyond/shape/imported-class";

export function classLabelOf(imported: ImportedClass): string {
  if (!imported.level.isKnown) return imported.name.text;
  return `${imported.name.text} ${imported.level.valueOr(0)}`;
}
