import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { classLabelOf } from "./class-label";

const BETWEEN_CLASSES = " / ";

export function subtitleOf(character: ImportedCharacter): string {
  const labels = character.classes.map(classLabelOf);
  if (labels.length === 0) return character.species.text;
  return `${character.species.text} ${labels.join(BETWEEN_CLASSES)}`;
}
