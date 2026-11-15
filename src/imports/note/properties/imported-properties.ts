import { ARMOUR_CLASS_NAME, MAX_HIT_POINTS_NAME, SPEED_NAME } from "../../../beyond/rules/core/number-names";
import { ARMOUR_CLASS_PROPERTY, HIT_POINTS_PROPERTY, SPEED_PROPERTY } from "../../layout/import-properties";
import { ClassProperty } from "./kinds/class-property";
import type { ImportedProperty } from "./kinds/imported-property";
import { NumberProperty } from "./kinds/number-property";
import { ScoreProperty } from "./kinds/score-property";
import { SCORE_ROWS } from "../rows/score-rows";
import { SpeciesProperty } from "./kinds/species-property";
import { SubtitleProperty } from "./kinds/subtitle-property";
import { TypeProperty } from "./kinds/type-property";

function scoreProperties(): ImportedProperty[] {
  const found: ImportedProperty[] = [];
  for (const row of SCORE_ROWS) found.push(new ScoreProperty(row));
  return found;
}

export const IMPORTED_PROPERTIES: readonly ImportedProperty[] = [
  new ClassProperty(),
  new SpeciesProperty(),
  new TypeProperty(),
  new SubtitleProperty(),
  new NumberProperty(ARMOUR_CLASS_PROPERTY, ARMOUR_CLASS_NAME),
  new NumberProperty(HIT_POINTS_PROPERTY, MAX_HIT_POINTS_NAME),
  new NumberProperty(SPEED_PROPERTY, SPEED_NAME),
  ...scoreProperties(),
];
