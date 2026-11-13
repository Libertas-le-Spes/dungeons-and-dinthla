import type { RuleCharacter } from "../../input/rule-character";
import { hasGrantingModifier } from "./modifier-grant";
import type { ProficiencyClaim, ProficiencyGrant } from "./proficiency-grant";

export class FullProficiencyGrant implements ProficiencyGrant {
  grants(character: RuleCharacter, claim: ProficiencyClaim): boolean {
    return hasGrantingModifier(character, claim, "proficiency");
  }

  shareOf(bonus: number): number {
    return bonus;
  }

  termsFor(bonus: number): readonly string[] {
    return [`proficiency ${bonus}`];
  }
}
