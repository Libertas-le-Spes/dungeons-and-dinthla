import { importNameOf } from "../../reading/import-key";
import { continuesAKey, propertyKeyOf } from "../../reading/property-key";

export function foreignPropertyLinesOf(inside: readonly string[]): string[] {
  const kept: string[] = [];
  let inImportKey = false;
  for (const line of inside) {
    if (inImportKey && continuesAKey(line)) continue;
    inImportKey = importNameOf(propertyKeyOf(line)) !== null;
    if (!inImportKey) kept.push(line);
  }
  return kept;
}
