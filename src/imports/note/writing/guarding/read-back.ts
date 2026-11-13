import { outsideTheImport } from "./outside-the-import";
import { wouldChangeMore } from "./refusals";

function sameLines(before: readonly string[], after: readonly string[]): boolean {
  if (before.length !== after.length) return false;
  for (const [position, line] of before.entries()) {
    if (after[position] !== line) return false;
  }
  return true;
}

export function refuseUnlessOnlyTheImportChanged(before: string, after: string): void {
  if (!sameLines(outsideTheImport(before), outsideTheImport(after))) throw wouldChangeMore();
}
