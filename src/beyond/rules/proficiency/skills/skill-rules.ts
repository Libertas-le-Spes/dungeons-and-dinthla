import type { Rule } from "../../core/rule";
import { SkillRule } from "./skill-rule";
import { SKILLS } from "./skills";

export const SKILL_RULES: readonly Rule[] = SKILLS.map((skill) => new SkillRule(skill));
