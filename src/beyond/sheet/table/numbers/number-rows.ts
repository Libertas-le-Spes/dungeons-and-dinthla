import type { NumberRow } from "../../numbers/number-row";
import { MODIFIER_ROWS } from "./modifier-rows";
import { PASSIVE_ROWS } from "./passive-rows";
import { SAVE_ROWS } from "./save-rows";
import { SKILL_ROWS } from "./skill-rows";
import { VITAL_ROWS } from "./vital-rows";

export const NUMBER_ROWS: readonly NumberRow[] = [...VITAL_ROWS, ...MODIFIER_ROWS, ...SAVE_ROWS, ...SKILL_ROWS, ...PASSIVE_ROWS];
