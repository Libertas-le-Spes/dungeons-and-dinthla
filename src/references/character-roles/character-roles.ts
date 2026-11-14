import type { CharacterRole } from "./character-role";
import { ledgerHolderRole } from "./ledger-holder-role";
import { questGiverRole } from "./quest-giver-role";

const CHARACTER_ROLES: CharacterRole[] = [questGiverRole, ledgerHolderRole];

export function characterLinksIn(text: string): string[] {
  return CHARACTER_ROLES.flatMap((role) => role.linksIn(text));
}
