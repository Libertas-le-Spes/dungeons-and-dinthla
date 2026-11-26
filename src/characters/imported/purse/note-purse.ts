import { PURSE_SECTION } from "../../../imports/layout/plugin-sections";
import { ImportedLists } from "../lists/imported-lists";
import { purseCoinsOf, type PurseCoin } from "../lists/purse-coin";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export function importedPurseOf(noteText: string, syntax: PropertiesSyntax): PurseCoin[] | null {
  const lists = ImportedLists.of(noteText, syntax);
  if (lists === null) return null;
  return purseCoinsOf(lists.of(PURSE_SECTION).entries);
}
