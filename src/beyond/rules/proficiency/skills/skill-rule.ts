import type { ImportedNumber } from "../../../shape/imported-number";
import { SKILL_BONUS } from "../../../shape/import-limits";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import { SKILL_TOUCHING } from "../../core/touching-lists";
import type { RuleCharacter } from "../../input/rule-character";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { proficientCheck } from "../proficient-check";
import type { Skill } from "./skill";

export class SkillRule implements Rule {
  private readonly names: readonly string[];
  private readonly family: SubTypeFamily;

  constructor(private readonly skill: Skill) {
    this.names = [skill.subType, "ability-checks", "skill-checks"];
    this.family = new SubTypeFamily(this.names, []);
  }

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const touching = SKILL_TOUCHING.unknownFor(character);
    if (touching !== null) return [{ name: this.skill.name, value: touching }];
    const value = proficientCheck(character, earlier, {
      ability: this.skill.ability,
      claim: { subType: this.skill.subType, halfApplies: true },
      family: this.family,
      plainSubTypes: this.names,
      range: SKILL_BONUS,
    });
    return [{ name: this.skill.name, value }];
  }
}
