import { ABILITIES } from "../input/ability";
import type { Rule } from "../core/rule";
import { SavingThrowRule } from "./saving-throw-rule";
import { SkillRule } from "./skill-rule";
import { SKILLS } from "./skills";

export const SAVING_THROW_RULES: readonly Rule[] = ABILITIES.map((ability) => new SavingThrowRule(ability));
export const SKILL_RULES: readonly Rule[] = SKILLS.map((skill) => new SkillRule(skill));
