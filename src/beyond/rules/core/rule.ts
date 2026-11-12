import type { ImportedNumber } from "../../shape/imported-number";
import type { RuleCharacter } from "../input/rule-character";
import type { EarlierNumbers } from "./earlier-numbers";

export interface Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[];
}
