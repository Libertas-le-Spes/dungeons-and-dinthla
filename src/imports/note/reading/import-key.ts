import { IMPORT_PROPERTIES } from "../../layout/import-properties";
import { keyDiffersByCapitals } from "./note-refusals";

export function importNameOf(key: string | null): string | null {
  if (key === null) return null;
  for (const name of IMPORT_PROPERTIES) {
    if (name === key) return name;
    if (name.toLowerCase() === key.toLowerCase()) throw keyDiffersByCapitals(key, name);
  }
  return null;
}
