import { IMPORT_PROPERTIES } from "../../layout/import-properties";
import { continuesAKey, propertyKeyOf } from "./property-key";

function isImportKey(key: string | null): boolean {
  if (key === null) return false;
  const lowered = key.toLowerCase();
  for (const name of IMPORT_PROPERTIES) {
    if (name.toLowerCase() === lowered) return true;
  }
  return false;
}

export function foreignPropertyLinesOf(inside: readonly string[]): string[] {
  const kept: string[] = [];
  let inImportKey = false;
  for (const line of inside) {
    if (inImportKey && continuesAKey(line)) continue;
    inImportKey = isImportKey(propertyKeyOf(line));
    if (!inImportKey) kept.push(line);
  }
  return kept;
}
