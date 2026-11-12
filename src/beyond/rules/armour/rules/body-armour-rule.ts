import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { RuleCharacter } from "../../input/rule-character";
import type { RuleItem } from "../../input/rule-item";
import type { ArmourCandidate } from "../choice/armour-candidate";
import { formulaCandidate } from "../choice/formula-candidate";
import type { WornArmour } from "../choice/worn-armour";
import type { ArmourRule } from "./armour-rule";

function candidateFor(character: RuleCharacter, earlier: EarlierNumbers): (armour: RuleItem) => ArmourCandidate {
  return function candidateOf(armour: RuleItem): ArmourCandidate {
    return formulaCandidate(character, earlier, {
      baseText: `${armour.name.text} ${armour.armourClass}`,
      baseAmount: armour.armourClass,
      dexterity: armour.armour,
      others: [],
      reason: armour.armour.label,
    });
  };
}

export class BodyArmourRule implements ArmourRule {
  candidates(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): readonly ArmourCandidate[] {
    return worn.body.map(candidateFor(character, earlier));
  }
}
