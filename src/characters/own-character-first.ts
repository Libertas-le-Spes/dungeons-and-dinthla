import type { CharacterCard } from "./character-card";

function isOwn(card: CharacterCard): boolean {
  return card.isOwn;
}

function isSomeoneElse(card: CharacterCard): boolean {
  return card.isOwn === false;
}

export function ownCharacterFirst(cards: CharacterCard[]): CharacterCard[] {
  const own = cards.filter(isOwn);
  const others = cards.filter(isSomeoneElse);
  return [...own, ...others];
}
