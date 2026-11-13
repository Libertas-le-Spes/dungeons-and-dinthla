import {
  GENERIC_SPELL_ATTACK_NAME,
  GENERIC_SPELL_SAVE_DC_NAME,
  spellAttackNameOf,
  spellSaveDcNameOf,
} from "../../rules/core/number-names";
import type { ImportedNumber } from "../../shape/imported-number";
import { hasLetterOrDigit } from "../lines/letter-or-digit";
import { lineOrNothing } from "../lines/line-or-nothing";
import type { SheetFields } from "../sheet-fields";
import { ATTACK_BONUS, CASTING_CLASS, SAVE_DC } from "../table/numbers/casting-fields";

interface CastingNames {
  readonly saveDc: string;
  readonly attack: string;
}

const GENERIC_NAMES: CastingNames = { saveDc: GENERIC_SPELL_SAVE_DC_NAME, attack: GENERIC_SPELL_ATTACK_NAME };

function labelOf(fields: SheetFields): string | null {
  const printed = fields.textAt(CASTING_CLASS);
  if (printed === null) return null;
  const line = lineOrNothing(printed);
  if (line === null) return null;
  if (!hasLetterOrDigit(line.text)) return null;
  return line.text;
}

function namesOf(fields: SheetFields): CastingNames {
  const label = labelOf(fields);
  if (label === null) return GENERIC_NAMES;
  return { saveDc: spellSaveDcNameOf(label), attack: spellAttackNameOf(label) };
}

export function castingNumbersOf(fields: SheetFields): readonly ImportedNumber[] {
  const names = namesOf(fields);
  return [
    { name: names.saveDc, value: SAVE_DC.read(fields) },
    { name: names.attack, value: ATTACK_BONUS.read(fields) },
  ];
}
