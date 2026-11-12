import type { RuleCharacter } from "../input/rule-character";
import type { WornArmour } from "./worn-armour";

export interface ArmourBonus {
  readonly term: string;
  readonly amount: number;
  appliesTo(character: RuleCharacter, worn: WornArmour): boolean;
}
