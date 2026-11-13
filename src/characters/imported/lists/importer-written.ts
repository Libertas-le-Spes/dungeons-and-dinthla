import { guardedLineOf } from "../../../imports/layout/guarded-line";
import { withoutEscapes } from "../reading/shown-text";

export const MOST_TRACKED_NAME_CHARACTERS = 100;

function characterCountOf(text: string): number {
  return Array.from(text).length;
}

export function isGuardedAsImported(written: string): boolean {
  return guardedLineOf(withoutEscapes(written)) === written;
}

export function isImporterWritten(written: string): boolean {
  if (characterCountOf(withoutEscapes(written)) > MOST_TRACKED_NAME_CHARACTERS) return false;
  return isGuardedAsImported(written);
}
