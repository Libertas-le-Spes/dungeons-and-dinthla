import { readMarker } from "../../notes/reading/marker";
import { readLedgerEntry } from "../../notes/reading/ledger";
import type { CharacterRole } from "./character-role";

export const ledgerHolderRole: CharacterRole = {
  linksIn(text: string): string[] {
    const marked = readMarker(text);
    if (marked.marker !== "ledger") return [];
    const entry = readLedgerEntry(marked.body);
    if (entry === null || entry.type !== "item") return [];
    if (entry.holder === "") return [];
    return [entry.holder];
  },
};
