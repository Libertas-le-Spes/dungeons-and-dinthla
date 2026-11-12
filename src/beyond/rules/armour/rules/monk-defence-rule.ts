import { hasClass } from "../../classes/has-class";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import { WISDOM } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import { abilityDefence } from "./ability-defence";
import type { ArmourCandidate } from "../choice/armour-candidate";
import type { ArmourRule } from "./armour-rule";
import type { WornArmour } from "../choice/worn-armour";

export class MonkDefenceRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    if (worn.body.length > 0) return null;
    if (worn.shields.length > 0) return null;
    if (!hasClass(character, "Monk")) return null;
    return abilityDefence(character, earlier, WISDOM, "monk's unarmoured defence");
  }
}
