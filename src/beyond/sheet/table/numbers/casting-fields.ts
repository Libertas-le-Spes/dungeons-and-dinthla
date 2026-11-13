import { SPELL_ATTACK, SPELL_SAVE_DC } from "../../../shape/import-limits";
import { SIGNED, WHOLE } from "../../numbers/number-texts";
import { PrintedNumber } from "../../numbers/printed-number";

export const CASTING_CLASS = "spellCastingClass0";
export const SAVE_DC = new PrintedNumber("spellSaveDC0", SPELL_SAVE_DC, WHOLE);
export const ATTACK_BONUS = new PrintedNumber("spellAtkBonus0", SPELL_ATTACK, SIGNED);
