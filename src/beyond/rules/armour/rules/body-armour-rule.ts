import { firstFound } from "../../core/first-found";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "../choice/armour-candidate";
import { formulaCandidate } from "../choice/formula-candidate";
import type { WornArmour } from "../choice/worn-armour";
import type { ArmourRule } from "./armour-rule";

export class BodyArmourRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    const armour = firstFound(worn.body);
    if (armour === undefined) return null;
    return formulaCandidate(character, earlier, {
      baseText: `${armour.name.text} ${armour.armourClass}`,
      baseAmount: armour.armourClass,
      dexterity: armour.armour,
      others: [],
      reason: armour.armour.label,
    });
  }
}
