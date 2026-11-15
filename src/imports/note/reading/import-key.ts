import { IMPORT_PROPERTIES, SUBTITLE_PROPERTY, TYPE_PROPERTY } from "../../layout/import-properties";
import { keyDiffersByCapitals } from "./note-refusals";

const KEYS_READ_WHATEVER_THE_CAPITALS: readonly string[] = [TYPE_PROPERTY, SUBTITLE_PROPERTY];

export function importNameOf(key: string | null): string | null {
  if (key === null) return null;
  for (const name of IMPORT_PROPERTIES) {
    if (name === key) return name;
    if (name.toLowerCase() !== key.toLowerCase()) continue;
    if (KEYS_READ_WHATEVER_THE_CAPITALS.includes(name)) return name;
    throw keyDiffersByCapitals(key, name);
  }
  return null;
}
