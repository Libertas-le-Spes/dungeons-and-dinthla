import type { RuleCharacter } from "../input/rule-character";

export interface ProficiencyClaim {
  readonly subType: string;
  readonly halfApplies: boolean;
}

export interface ProficiencyGrant {
  grants(character: RuleCharacter, claim: ProficiencyClaim): boolean;
  shareOf(bonus: number): number;
  termsFor(bonus: number): readonly string[];
}
