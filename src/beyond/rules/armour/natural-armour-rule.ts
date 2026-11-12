import type { RuleCharacter } from "../input/rule-character";
import type { ArmourCandidate } from "./armour-candidate";
import { UnknownCandidate } from "./armour-candidate";
import type { ArmourRule } from "./armour-rule";
import { NATURAL_ARMOUR_SPECIES } from "./natural-armour-species";

export class NaturalArmourRule implements ArmourRule {
  candidate(character: RuleCharacter): ArmourCandidate | null {
    if (!NATURAL_ARMOUR_SPECIES.includes(character.species)) return null;
    return new UnknownCandidate(`${character.species} has natural armour, which is not worked out here yet.`);
  }
}
