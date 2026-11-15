import { CONDITION_COUNT, CUSTOM_PROFICIENCY_COUNT } from "../../../shape/import-limits";
import type { ImportedNumber } from "../../../shape/imported-number";
import type { JsonReader } from "../../json/json-reader";
import { NamedBlanket } from "./blanket";
import type { Blanket } from "./blanket";
import { ConditionBlanket } from "./condition-blanket";
import { characterValuesOf } from "./read-character-values";
import { PROFICIENCY_NUMBER_NAMES } from "./proficiency-number-names";

const CUSTOM_PROFICIENCIES = "Proficiencies set by hand. Type them on your note.";
const CONDITIONS = "A condition applies. Type them on your note.";

export interface HandSet {
  readonly setByHand: readonly ImportedNumber[];
  readonly blankets: readonly Blanket[];
}

function blanketsFor(data: JsonReader): readonly Blanket[] {
  const found: Blanket[] = [];
  if (data.listAtOrEmpty("customProficiencies", CUSTOM_PROFICIENCY_COUNT).length > 0) found.push(new NamedBlanket(CUSTOM_PROFICIENCIES, PROFICIENCY_NUMBER_NAMES));
  if (data.listAtOrEmpty("conditions", CONDITION_COUNT).length > 0) found.push(new ConditionBlanket(CONDITIONS));
  return found;
}

export function handSetOf(data: JsonReader): HandSet {
  const values = characterValuesOf(data);
  return { setByHand: values.setByHand, blankets: [...values.blankets, ...blanketsFor(data)] };
}
