import { hasClass } from "../classes/has-class";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { CONSTITUTION } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { abilityDefence } from "./ability-defence";
import type { ArmourCandidate } from "./armour-candidate";
import type { ArmourRule } from "./armour-rule";
import type { WornArmour } from "./worn-armour";

export class BarbarianDefenceRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    if (worn.body.length > 0) return null;
    if (!hasClass(character, "Barbarian")) return null;
    return abilityDefence(character, earlier, CONSTITUTION, "barbarian's unarmoured defence");
  }
}
