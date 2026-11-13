import { importNameOf } from "../reading/import-key";
import { plainLineOf } from "../reading/line-ending";
import { propertyKeyOf } from "../reading/property-key";
import type { NoteLayout } from "../reading/note-layout";

export function propertyValuesOf(layout: NoteLayout): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of layout.propertyLines()) {
    const plain = plainLineOf(line);
    const name = importNameOf(propertyKeyOf(plain));
    if (name === null) continue;
    values.set(name, plain.slice(plain.indexOf(":") + 1).trim());
  }
  return values;
}
