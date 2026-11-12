import type { RuleCharacter } from "../input/rule-character";
import type { ProficiencyClaim, ProficiencyGrant } from "./proficiency-grant";

export class HalfProficiencyGrant implements ProficiencyGrant {
  grants(character: RuleCharacter, claim: ProficiencyClaim): boolean {
    if (!claim.halfApplies) return false;
    return character.features.includes("Jack of All Trades");
  }

  shareOf(bonus: number): number {
    return Math.floor(bonus / 2);
  }

  termsFor(bonus: number): readonly string[] {
    return [`half proficiency ${this.shareOf(bonus)}`];
  }
}
