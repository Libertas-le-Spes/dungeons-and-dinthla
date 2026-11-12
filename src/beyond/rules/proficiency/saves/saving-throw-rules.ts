import type { Rule } from "../../core/rule";
import { ABILITIES } from "../../input/ability";
import { SavingThrowRule } from "./saving-throw-rule";

export const SAVING_THROW_RULES: readonly Rule[] = ABILITIES.map((ability) => new SavingThrowRule(ability));
