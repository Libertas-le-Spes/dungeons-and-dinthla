import { SPELL_ATTACK, SPELL_SAVE_DC } from "../../../shape/import-limits";
import { NumberRow } from "../../numbers/number-row";
import { SIGNED, WHOLE } from "../../numbers/number-texts";

export const CASTING_ROWS: readonly NumberRow[] = [
  new NumberRow("Spell save DC", "spellSaveDC0", SPELL_SAVE_DC, WHOLE),
  new NumberRow("Spell attack bonus", "spellAtkBonus0", SPELL_ATTACK, SIGNED),
];
