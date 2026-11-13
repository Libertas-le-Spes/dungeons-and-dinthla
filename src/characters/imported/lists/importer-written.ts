import { withEscapedCharacters } from "../../../imports/layout/character-escapes";
import { withoutEscapes } from "../reading/shown-text";

export const MOST_TRACKED_NAME_CHARACTERS = 100;

function characterCountOf(text: string): number {
  return Array.from(text).length;
}

export function isImporterWritten(written: string): boolean {
  const shown = withoutEscapes(written);
  if (characterCountOf(shown) > MOST_TRACKED_NAME_CHARACTERS) return false;
  return withEscapedCharacters(shown) === written;
}
