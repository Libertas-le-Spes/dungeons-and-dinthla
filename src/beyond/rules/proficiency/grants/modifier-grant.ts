import type { RuleCharacter } from "../../input/rule-character";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ProficiencyClaim } from "./proficiency-grant";

function isGrantedBy(modifier: RuleModifier, claim: ProficiencyClaim, type: string): boolean {
  if (!modifier.inForce) return false;
  if (modifier.type !== type) return false;
  return modifier.subType.text === claim.subType;
}

export function hasGrantingModifier(character: RuleCharacter, claim: ProficiencyClaim, type: string): boolean {
  for (const modifier of character.modifiers) {
    if (isGrantedBy(modifier, claim, type)) return true;
  }
  return false;
}
