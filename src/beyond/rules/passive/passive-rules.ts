import type { Rule } from "../core/rule";
import { INSIGHT, INVESTIGATION, PERCEPTION } from "../proficiency/skills";
import { PassiveScoreRule } from "./passive-score-rule";

export const PASSIVE_RULES: readonly Rule[] = [new PassiveScoreRule(PERCEPTION), new PassiveScoreRule(INVESTIGATION), new PassiveScoreRule(INSIGHT)];
