import { PURSE_SECTION } from "../../../imports/layout/plugin-sections";
import { ImportedLists } from "../lists/imported-lists";
import { purseCoinsOf, type PurseCoin } from "../lists/purse-coin";

export function importedPurseOf(noteText: string): PurseCoin[] | null {
  const lists = ImportedLists.of(noteText);
  if (lists === null) return null;
  return purseCoinsOf(lists.of(PURSE_SECTION).entries);
}
