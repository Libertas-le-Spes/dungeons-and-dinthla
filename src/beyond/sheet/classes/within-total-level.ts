import type { ImportedClass } from "../../shape/imported-class";
import { TOTAL_LEVEL } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { PRINTED } from "../printed-route";

function addedLevel(total: number, imported: ImportedClass): number {
  return total + imported.level.valueOr(0);
}

function withoutLevel(imported: ImportedClass): ImportedClass {
  return { name: imported.name, level: new NotKnownValue(`${TOTAL_LEVEL.what} has to be at most ${TOTAL_LEVEL.highest}.`, PRINTED) };
}

export function withinTotalLevel(classes: readonly ImportedClass[]): readonly ImportedClass[] {
  if (classes.reduce(addedLevel, 0) <= TOTAL_LEVEL.highest) return classes;
  return classes.map(withoutLevel);
}
