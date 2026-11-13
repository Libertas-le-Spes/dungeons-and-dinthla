import type { ImportedCharacter } from "../../../beyond/shape/imported-character";
import { importMarkLinesOf } from "./import-mark-lines";
import { IMPORTED_PROPERTIES } from "./imported-properties";

export function propertyLinesOf(character: ImportedCharacter, today: string): string[] {
  const lines = importMarkLinesOf(character.route, today);
  for (const property of IMPORTED_PROPERTIES) {
    const line = property.lineOf(character);
    if (line !== null) lines.push(line);
  }
  return lines;
}
