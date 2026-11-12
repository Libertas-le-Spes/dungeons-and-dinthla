import { CLASS_COUNT } from "../../shape/import-limits";
import type { ImportedClass } from "../../shape/imported-class";
import { limitedList } from "../../shape/limited-list";
import type { SheetFields } from "../sheet-fields";
import { noClass } from "../refusals/sheet-refusals";
import { CLASS_AND_LEVEL } from "../table/identity-fields";
import { classOfPiece } from "./class-piece";
import { withinTotalLevel } from "./within-total-level";

const BETWEEN_CLASSES = "/";

function usableClasses(text: string): ImportedClass[] {
  const found: ImportedClass[] = [];
  for (const piece of text.split(BETWEEN_CLASSES)) {
    const imported = classOfPiece(piece);
    if (imported !== null) found.push(imported);
  }
  return found;
}

export function classesOf(fields: SheetFields): readonly ImportedClass[] {
  const printed = fields.textAt(CLASS_AND_LEVEL);
  if (printed === null) throw noClass();
  const found = limitedList(usableClasses(printed), CLASS_COUNT);
  if (found.length === 0) throw noClass();
  return withinTotalLevel(found);
}
