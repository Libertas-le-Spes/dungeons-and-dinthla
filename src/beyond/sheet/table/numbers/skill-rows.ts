import { SKILL_BONUS } from "../../../shape/import-limits";
import {
  ACROBATICS,
  ANIMAL_HANDLING,
  ARCANA,
  ATHLETICS,
  DECEPTION,
  HISTORY,
  INSIGHT,
  INTIMIDATION,
  INVESTIGATION,
  MEDICINE,
  NATURE,
  PERCEPTION,
  PERFORMANCE,
  PERSUASION,
  RELIGION,
  SLEIGHT_OF_HAND,
  STEALTH,
  SURVIVAL,
} from "../../../rules/proficiency/skills/skills";
import { NumberRow } from "../../numbers/number-row";
import { SIGNED } from "../../numbers/number-texts";

export const SKILL_ROWS: readonly NumberRow[] = [
  new NumberRow(ACROBATICS.name, "Acrobatics", SKILL_BONUS, SIGNED),
  new NumberRow(ANIMAL_HANDLING.name, "Animal", SKILL_BONUS, SIGNED),
  new NumberRow(ARCANA.name, "Arcana", SKILL_BONUS, SIGNED),
  new NumberRow(ATHLETICS.name, "Athletics", SKILL_BONUS, SIGNED),
  new NumberRow(DECEPTION.name, "Deception", SKILL_BONUS, SIGNED),
  new NumberRow(HISTORY.name, "History", SKILL_BONUS, SIGNED),
  new NumberRow(INSIGHT.name, "Insight", SKILL_BONUS, SIGNED),
  new NumberRow(INTIMIDATION.name, "Intimidation", SKILL_BONUS, SIGNED),
  new NumberRow(INVESTIGATION.name, "Investigation", SKILL_BONUS, SIGNED),
  new NumberRow(MEDICINE.name, "Medicine", SKILL_BONUS, SIGNED),
  new NumberRow(NATURE.name, "Nature", SKILL_BONUS, SIGNED),
  new NumberRow(PERCEPTION.name, "Perception", SKILL_BONUS, SIGNED),
  new NumberRow(PERFORMANCE.name, "Performance", SKILL_BONUS, SIGNED),
  new NumberRow(PERSUASION.name, "Persuasion", SKILL_BONUS, SIGNED),
  new NumberRow(RELIGION.name, "Religion", SKILL_BONUS, SIGNED),
  new NumberRow(SLEIGHT_OF_HAND.name, "SleightofHand", SKILL_BONUS, SIGNED),
  new NumberRow(STEALTH.name, "Stealth ", SKILL_BONUS, SIGNED),
  new NumberRow(SURVIVAL.name, "Survival", SKILL_BONUS, SIGNED),
];
