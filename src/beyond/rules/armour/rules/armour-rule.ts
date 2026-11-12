import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "../choice/armour-candidate";
import type { WornArmour } from "../choice/worn-armour";

export interface ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null;
}
