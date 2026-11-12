import type { EarlierNumbers } from "../core/earlier-numbers";
import { draconicSorcerers } from "../classes/draconic-sorcerer";
import { isTwentyFourteen } from "../input/edition";
import type { RuleCharacter } from "../input/rule-character";
import type { ArmourCandidate } from "./armour-candidate";
import { KnownCandidate, UnknownCandidate } from "./armour-candidate";
import type { ArmourRule } from "./armour-rule";
import { unknownCandidateAmong } from "./unknown-candidate-among";
import type { WornArmour } from "./worn-armour";

export class DraconicDefenceRule implements ArmourRule {
  candidate(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): ArmourCandidate | null {
    if (worn.body.length > 0) return null;
    if (draconicSorcerers(character.classes).length === 0) return null;
    if (!isTwentyFourteen(character.edition)) return new UnknownCandidate("The draconic sorcerer's armour class is worked differently in the 2014 and 2024 rules, and the edition is not 2014.");
    const unknown = unknownCandidateAmong(["DEX modifier"], character, earlier);
    if (unknown !== null) return unknown;
    const dexterity = earlier.valueOf("DEX modifier", character.route).valueOr(0);
    return new KnownCandidate(13 + dexterity, ["13", `DEX ${dexterity}`], "draconic bloodline's natural armour");
  }
}
