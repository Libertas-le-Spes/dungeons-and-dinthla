import { SAVING_THROW } from "../../../shape/import-limits";
import { CHARISMA, CONSTITUTION, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../../../rules/input/ability";
import { NumberRow } from "../../numbers/number-row";
import { SIGNED } from "../../numbers/number-texts";

export const SAVE_ROWS: readonly NumberRow[] = [
  new NumberRow(STRENGTH.saveName, "ST Strength", SAVING_THROW, SIGNED),
  new NumberRow(DEXTERITY.saveName, "ST Dexterity", SAVING_THROW, SIGNED),
  new NumberRow(CONSTITUTION.saveName, "ST Constitution", SAVING_THROW, SIGNED),
  new NumberRow(INTELLIGENCE.saveName, "ST Intelligence", SAVING_THROW, SIGNED),
  new NumberRow(WISDOM.saveName, "ST Wisdom", SAVING_THROW, SIGNED),
  new NumberRow(CHARISMA.saveName, "ST Charisma", SAVING_THROW, SIGNED),
];
