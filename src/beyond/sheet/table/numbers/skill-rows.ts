import { SKILL_BONUS } from "../../../shape/import-limits";
import { NumberRow } from "../../numbers/number-row";
import { SIGNED } from "../../numbers/number-texts";

export const SKILL_ROWS: readonly NumberRow[] = [
  new NumberRow("Acrobatics", "Acrobatics", SKILL_BONUS, SIGNED),
  new NumberRow("Animal Handling", "Animal", SKILL_BONUS, SIGNED),
  new NumberRow("Arcana", "Arcana", SKILL_BONUS, SIGNED),
  new NumberRow("Athletics", "Athletics", SKILL_BONUS, SIGNED),
  new NumberRow("Deception", "Deception", SKILL_BONUS, SIGNED),
  new NumberRow("History", "History", SKILL_BONUS, SIGNED),
  new NumberRow("Insight", "Insight", SKILL_BONUS, SIGNED),
  new NumberRow("Intimidation", "Intimidation", SKILL_BONUS, SIGNED),
  new NumberRow("Investigation", "Investigation", SKILL_BONUS, SIGNED),
  new NumberRow("Medicine", "Medicine", SKILL_BONUS, SIGNED),
  new NumberRow("Nature", "Nature", SKILL_BONUS, SIGNED),
  new NumberRow("Perception", "Perception", SKILL_BONUS, SIGNED),
  new NumberRow("Performance", "Performance", SKILL_BONUS, SIGNED),
  new NumberRow("Persuasion", "Persuasion", SKILL_BONUS, SIGNED),
  new NumberRow("Religion", "Religion", SKILL_BONUS, SIGNED),
  new NumberRow("Sleight of Hand", "SleightofHand", SKILL_BONUS, SIGNED),
  new NumberRow("Stealth", "Stealth ", SKILL_BONUS, SIGNED),
  new NumberRow("Survival", "Survival", SKILL_BONUS, SIGNED),
];
