import type { Rule } from "../../core/rule";
import { SkillRule } from "./skill-rule";
import { SKILLS } from "./skills";
import type { Skill } from "./skill";

function ruleOf(skill: Skill): Rule {
  return new SkillRule(skill);
}

export const SKILL_RULES: readonly Rule[] = SKILLS.map(ruleOf);
