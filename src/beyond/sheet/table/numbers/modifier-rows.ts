import { ABILITY_MODIFIER } from "../../../shape/import-limits";
import { CHARISMA, CONSTITUTION, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../../../rules/input/ability";
import { NumberRow } from "../../numbers/number-row";
import { SIGNED } from "../../numbers/number-texts";

export const MODIFIER_ROWS: readonly NumberRow[] = [
  new NumberRow(STRENGTH.modifierName, "STRmod", ABILITY_MODIFIER, SIGNED),
  new NumberRow(DEXTERITY.modifierName, "DEXmod ", ABILITY_MODIFIER, SIGNED),
  new NumberRow(CONSTITUTION.modifierName, "CONmod", ABILITY_MODIFIER, SIGNED),
  new NumberRow(INTELLIGENCE.modifierName, "INTmod", ABILITY_MODIFIER, SIGNED),
  new NumberRow(WISDOM.modifierName, "WISmod", ABILITY_MODIFIER, SIGNED),
  new NumberRow(CHARISMA.modifierName, "CHamod", ABILITY_MODIFIER, SIGNED),
];
