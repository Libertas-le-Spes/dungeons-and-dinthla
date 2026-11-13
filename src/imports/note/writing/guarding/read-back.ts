import { outsideTheImport } from "./outside-the-import";
import { wouldChangeMore } from "./refusals";

function sameLines(before: readonly string[], after: readonly string[]): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function refuseUnlessOnlyTheImportChanged(before: string, after: string): void {
  if (!sameLines(outsideTheImport(before), outsideTheImport(after))) throw wouldChangeMore();
}
