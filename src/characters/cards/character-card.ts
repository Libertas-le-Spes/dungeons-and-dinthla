import type { SheetValues } from "../reading/sheet-values";
import type { CardStanding } from "./card-standing";

export interface CharacterCard {
  path: string;
  name: string;
  values: SheetValues;
  isOwn: boolean;
  standing: CardStanding;
}
