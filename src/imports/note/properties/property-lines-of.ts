import type { ImportedCharacter } from "../../../beyond/shape/imported-character";
import { importMarkLinesOf } from "./helpers/import-mark-lines";
import { IMPORTED_PROPERTIES } from "./imported-properties";
import type { ImportStamp } from "./import-stamp";

export interface ImportedProperties {
  character: ImportedCharacter;
  stamp: ImportStamp;
}

export function propertyLinesOf({ character, stamp }: ImportedProperties): string[] {
  const lines = importMarkLinesOf({ route: character.route, stamp });
  for (const property of IMPORTED_PROPERTIES) {
    const line = property.lineOf(character);
    if (line !== null) lines.push(line);
  }
  return lines;
}
