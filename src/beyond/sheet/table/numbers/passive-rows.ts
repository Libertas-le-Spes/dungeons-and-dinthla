import { PASSIVE_SCORE } from "../../../shape/import-limits";
import { INSIGHT, INVESTIGATION, PERCEPTION } from "../../../rules/proficiency/skills/skills";
import { NumberRow } from "../../numbers/number-row";
import { WHOLE } from "../../numbers/number-texts";

export const PASSIVE_ROWS: readonly NumberRow[] = [
  new NumberRow(PERCEPTION.passiveName, "Passive1", PASSIVE_SCORE, WHOLE),
  new NumberRow(INSIGHT.passiveName, "Passive2", PASSIVE_SCORE, WHOLE),
  new NumberRow(INVESTIGATION.passiveName, "Passive3", PASSIVE_SCORE, WHOLE),
];
