import type { ImportedCharacter } from "../../../beyond/shape/imported-character";

export interface ImportedProperty {
  readonly name: string;
  lineOf(character: ImportedCharacter): string | null;
}
