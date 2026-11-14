import { isBackupStanding } from "./card-standing";
import type { CharacterCard } from "./character-card";
import { ownCharacterFirst } from "./own-character-first";

function isBackup(card: CharacterCard): boolean {
  if (card.isOwn) return false;
  return isBackupStanding(card.standing);
}

function isPlayed(card: CharacterCard): boolean {
  return !isBackup(card);
}

export function playedCards(cards: readonly CharacterCard[]): CharacterCard[] {
  return ownCharacterFirst(cards.filter(isPlayed));
}

export function backupCards(cards: readonly CharacterCard[]): CharacterCard[] {
  return cards.filter(isBackup);
}
