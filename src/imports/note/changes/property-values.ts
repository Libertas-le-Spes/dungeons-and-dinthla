import { IMPORT_PROPERTIES } from "../../layout/import-properties";
import { plainLineOf } from "../reading/line-ending";
import { propertyKeyOf } from "../writing/property-key";
import type { NoteLayout } from "../reading/note-layout";

export function propertyValuesOf(layout: NoteLayout): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of layout.propertyLines()) {
    const plain = plainLineOf(line);
    const key = propertyKeyOf(plain);
    if (key === null) continue;
    for (const name of IMPORT_PROPERTIES) {
      if (name.toLowerCase() === key.toLowerCase()) values.set(name, plain.slice(plain.indexOf(":") + 1).trim());
    }
  }
  return values;
}
