import type { RuleCharacter } from "../input/rule-character";
import type { ArmourBonus } from "./armour-bonus";
import type { WornArmour } from "./worn-armour";

export class DefenceStyleBonus implements ArmourBonus {
  readonly term = "Defense 1";
  readonly amount = 1;

  appliesTo(character: RuleCharacter, worn: WornArmour): boolean {
    if (worn.body.length === 0) return false;
    return character.features.includes("Defense");
  }
}
