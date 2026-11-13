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
  candidates(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): readonly ArmourCandidate[] {
    if (worn.body.length > 0) return [];
    if (!hasClass(character, BARBARIAN_NAME)) return [];
    return [formulaCandidate(character, earlier, { baseText: "10", baseAmount: 10, dexterity: new FullDexterity(), others: [CONSTITUTION], reason: "barbarian's unarmoured defence" })];
  }
}
