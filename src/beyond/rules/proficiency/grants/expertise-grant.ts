import type { RuleCharacter } from "../../input/rule-character";
import { hasGrantingModifier } from "./modifier-grant";
import type { ProficiencyClaim, ProficiencyGrant } from "./proficiency-grant";

export class ExpertiseGrant implements ProficiencyGrant {
  grants(character: RuleCharacter, claim: ProficiencyClaim): boolean {
    return hasGrantingModifier(character, claim, "expertise");
  }

  shareOf(bonus: number): number {
    return bonus * 2;
  }

  termsFor(bonus: number): readonly string[] {
    return [`expertise ${this.shareOf(bonus)}`];
  }
}
