import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "../choice/armour-candidate";
import { KnownCandidate } from "../choice/armour-candidate";
import type { ArmourRule } from "./armour-rule";
import { unknownCandidateAmong } from "../choice/unknown-candidate-among";
import type { WornArmour } from "../choice/worn-armour";

export class PlainDefenceRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    if (worn.body.length > 0) return null;
    const unknown = unknownCandidateAmong(["DEX modifier"], character, earlier);
    if (unknown !== null) return unknown;
    const dexterity = earlier.valueOf("DEX modifier", character.route).valueOr(0);
    return new KnownCandidate(10 + dexterity, ["10", `DEX ${dexterity}`], "no armour");
  }
}
