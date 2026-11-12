import { BARBARIAN_NAME } from "../../classes/class-names";
import { hasClass } from "../../classes/has-class";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import { CONSTITUTION } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "../choice/armour-candidate";
import { FullDexterity } from "../choice/dexterity-part";
import { formulaCandidate } from "../choice/formula-candidate";
import type { WornArmour } from "../choice/worn-armour";
import type { ArmourRule } from "./armour-rule";

export class BarbarianDefenceRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    if (worn.body.length > 0) return null;
    if (!hasClass(character, BARBARIAN_NAME)) return null;
    return formulaCandidate(character, earlier, { baseText: "10", baseAmount: 10, dexterity: new FullDexterity(), others: [CONSTITUTION], reason: "barbarian's unarmoured defence" });
  }
}
