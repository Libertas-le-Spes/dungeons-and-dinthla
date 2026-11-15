import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";

function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function bodyOf(character: ImportedCharacter): string {
  const words: string[] = [];
  if (character.size !== null) words.push(character.size.text.toLowerCase());
  if (character.creatureType !== null) words.push(character.creatureType.text.toLowerCase());
  const species = character.species.text.toLowerCase();
  if (words.length === 0) return species;
  return `${words.join(" ")} (${species})`;
}

export function typeLineOf(character: ImportedCharacter): string {
  const parts = [bodyOf(character)];
  if (character.alignment !== null) parts.push(character.alignment.text.toLowerCase());
  return capitalised(parts.join(", "));
}
