import type { LineLoss } from "./lines/line-loss";
import type { ImportedCharacter } from "../shape/imported-character";

export interface LeftOut {
  readonly items: LineLoss;
  readonly spells: LineLoss;
  readonly features: LineLoss;
}

export interface PrintedSheet {
  readonly character: ImportedCharacter;
  readonly leftOut: LeftOut;
  readonly beyondNumber: number | null;
}
