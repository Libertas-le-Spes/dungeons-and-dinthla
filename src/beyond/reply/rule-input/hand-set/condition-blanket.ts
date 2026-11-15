import { CURRENT_HIT_POINTS_NAME, MAX_HIT_POINTS_NAME, SPEED_NAME } from "../../../rules/core/number-names";
import type { Blanket } from "./blanket";
import { PROFICIENCY_NUMBER_NAMES } from "./proficiency-number-names";

const NAMED: readonly string[] = [SPEED_NAME, MAX_HIT_POINTS_NAME, CURRENT_HIT_POINTS_NAME, ...PROFICIENCY_NUMBER_NAMES];
const ENDINGS: readonly string[] = ["spell save dc", "spell attack bonus"];

export class ConditionBlanket implements Blanket {
  constructor(readonly reason: string) {}

  covers(name: string): boolean {
    if (NAMED.includes(name)) return true;
    return ENDINGS.some((ending) => name.toLowerCase().endsWith(ending));
  }
}
