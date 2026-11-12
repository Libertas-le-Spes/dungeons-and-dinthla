import { firstOf } from "../core/first-of";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { RuleCharacter } from "../input/rule-character";
import type { ArmourCandidate } from "./armour-candidate";
import { KnownCandidate } from "./armour-candidate";
import type { ArmourRule } from "./armour-rule";
import { unknownCandidateAmong } from "./unknown-candidate-among";
import type { WornArmour } from "./worn-armour";

export class BodyArmourRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    const armour = firstOf(worn.body);
    if (armour === undefined) return null;
    const unknown = unknownCandidateAmong(["DEX modifier"], character, earlier);
    if (unknown !== null) return unknown;
    const dexterity = earlier.valueOf("DEX modifier", character.route).valueOr(0);
    const part = armour.armour.dexterityPart(dexterity);
    return new KnownCandidate(armour.armourClass + part, [`${armour.name} ${armour.armourClass}`, `DEX ${part}`], armour.armour.label);
  }
}
