import {
  CHARISMA_PROPERTY,
  CONSTITUTION_PROPERTY,
  DEXTERITY_PROPERTY,
  INTELLIGENCE_PROPERTY,
  STRENGTH_PROPERTY,
  WISDOM_PROPERTY,
} from "../../layout/import-properties";
import { ScoreRow } from "./score-row";

export const SCORE_ROWS: readonly ScoreRow[] = [
  new ScoreRow(STRENGTH_PROPERTY, "strength"),
  new ScoreRow(DEXTERITY_PROPERTY, "dexterity"),
  new ScoreRow(CONSTITUTION_PROPERTY, "constitution"),
  new ScoreRow(INTELLIGENCE_PROPERTY, "intelligence"),
  new ScoreRow(WISDOM_PROPERTY, "wisdom"),
  new ScoreRow(CHARISMA_PROPERTY, "charisma"),
];
