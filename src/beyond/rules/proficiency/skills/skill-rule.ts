import type { ImportedNumber } from "../../../shape/imported-number";
import { SKILL_BONUS } from "../../../shape/import-limits";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import type { RuleCharacter } from "../../input/rule-character";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { proficientCheck } from "../proficient-check";
import type { Skill } from "./skill";

export class SkillRule implements Rule {
  constructor(private readonly skill: Skill) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const value = proficientCheck(character, earlier, {
      abilityShort: this.skill.ability.short,
      claim: { subType: this.skill.subType, halfApplies: true },
      family: new SubTypeFamily([this.skill.subType], []),
      plainSubTypes: [this.skill.subType],
      range: SKILL_BONUS,
    });
    return [{ name: this.skill.name, value }];
  }
}
