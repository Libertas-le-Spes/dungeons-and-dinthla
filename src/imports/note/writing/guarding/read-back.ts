import { outsideTheImport } from "./outside-the-import";
import { wouldChangeMore } from "./refusals";
import type { PropertiesSyntax } from "../../../../campaign/paths/session-file";

function sameLines(before: readonly string[], after: readonly string[]): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function refuseUnlessOnlyTheImportChanged(before: string, after: string, syntax: PropertiesSyntax): void {
  if (!sameLines(outsideTheImport(before, syntax), outsideTheImport(after, syntax))) throw wouldChangeMore();
}
