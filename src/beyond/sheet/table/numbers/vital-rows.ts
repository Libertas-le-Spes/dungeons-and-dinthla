import { ARMOUR_CLASS, HIT_POINTS, INITIATIVE, MAX_HIT_POINTS, PROFICIENCY_BONUS, SPEED, TEMPORARY_HIT_POINTS } from "../../../shape/import-limits";
import {
  ARMOUR_CLASS_NAME,
  CURRENT_HIT_POINTS_NAME,
  INITIATIVE_NAME,
  MAX_HIT_POINTS_NAME,
  PROFICIENCY_BONUS_NAME,
  SPEED_NAME,
  TEMPORARY_HIT_POINTS_NAME,
} from "../../../rules/core/number-names";
import { NumberRow } from "../../numbers/number-row";
import { FEET, SIGNED, WHOLE } from "../../numbers/number-texts";

export const VITAL_ROWS: readonly NumberRow[] = [
  new NumberRow(ARMOUR_CLASS_NAME, "AC", ARMOUR_CLASS, WHOLE),
  new NumberRow(MAX_HIT_POINTS_NAME, "MaxHP", MAX_HIT_POINTS, WHOLE),
  new NumberRow(CURRENT_HIT_POINTS_NAME, "CurrentHP", HIT_POINTS, WHOLE),
  new NumberRow(TEMPORARY_HIT_POINTS_NAME, "TempHP", TEMPORARY_HIT_POINTS, WHOLE),
  new NumberRow(INITIATIVE_NAME, "Init", INITIATIVE, SIGNED),
  new NumberRow(SPEED_NAME, "Speed", SPEED, FEET),
  new NumberRow(PROFICIENCY_BONUS_NAME, "ProfBonus", PROFICIENCY_BONUS, SIGNED),
];
