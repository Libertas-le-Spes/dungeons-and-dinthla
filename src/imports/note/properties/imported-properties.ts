import { ARMOUR_CLASS_NAME, MAX_HIT_POINTS_NAME, SPEED_NAME } from "../../../beyond/rules/core/number-names";
import { ARMOUR_CLASS_PROPERTY, HIT_POINTS_PROPERTY, SPEED_PROPERTY } from "../../layout/import-properties";
import { ClassProperty } from "./class-property";
import type { ImportedProperty } from "./imported-property";
import { NumberProperty } from "./number-property";
import { ScoreProperty } from "./score-property";
import { SCORE_ROWS } from "./score-rows";
import { SpeciesProperty } from "./species-property";

function scoreProperties(): ImportedProperty[] {
  const found: ImportedProperty[] = [];
  for (const row of SCORE_ROWS) found.push(new ScoreProperty(row));
  return found;
}

export const IMPORTED_PROPERTIES: readonly ImportedProperty[] = [
  new ClassProperty(),
  new SpeciesProperty(),
  new NumberProperty(ARMOUR_CLASS_PROPERTY, ARMOUR_CLASS_NAME),
  new NumberProperty(HIT_POINTS_PROPERTY, MAX_HIT_POINTS_NAME),
  new NumberProperty(SPEED_PROPERTY, SPEED_NAME),
  ...scoreProperties(),
];
