import { draconicSorcerers } from "../../classes/draconic-sorcerer";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import { isTwentyFourteen } from "../../input/edition";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "../choice/armour-candidate";
import { UnknownCandidate } from "../choice/armour-candidate";
import { FullDexterity } from "../choice/dexterity-part";
import { formulaCandidate } from "../choice/formula-candidate";
import type { WornArmour } from "../choice/worn-armour";
import type { ArmourRule } from "./armour-rule";

const EDITION_REASON = "The draconic sorcerer's armour class is worked differently in the 2014 and 2024 rules, and the edition is not 2014.";

export class DraconicDefenceRule implements ArmourRule {
  candidates(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): readonly ArmourCandidate[] {
    if (worn.body.length > 0) return [];
    if (draconicSorcerers(character.classes).length === 0) return [];
    if (!isTwentyFourteen(character.edition)) return [new UnknownCandidate(EDITION_REASON)];
    return [formulaCandidate(character, earlier, { baseText: "13", baseAmount: 13, dexterity: new FullDexterity(), others: [], reason: "draconic bloodline's natural armour" })];
  }
}
