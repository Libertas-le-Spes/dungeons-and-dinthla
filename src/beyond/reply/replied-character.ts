import type { ImportedCharacter } from "../shape/imported-character";

export interface RepliedCharacter {
  readonly id: number;
  readonly character: ImportedCharacter;
}
