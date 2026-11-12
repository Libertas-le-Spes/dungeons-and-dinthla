import type { RuleCharacter } from "../../input/rule-character";
import type { ProficiencyClaim } from "./proficiency-grant";

export function hasGrantingModifier(character: RuleCharacter, claim: ProficiencyClaim, type: string): boolean {
  return character.modifiers.some((modifier) => modifier.appliesNow && modifier.type === type && modifier.subType === claim.subType);
}
