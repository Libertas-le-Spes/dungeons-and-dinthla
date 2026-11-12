import type { ImportedNumber } from "../../../shape/imported-number";
import { SPELL_SLOTS } from "../../../shape/import-limits";
import { SPELL_SLOTS_NAME, slotLevelNameOf } from "../../core/number-names";
import { knownIn, notKnown } from "../../core/worked";
import type { RuleCharacter } from "../../input/rule-character";

export function slotNumbersFrom(slots: readonly number[], working: string, character: RuleCharacter): readonly ImportedNumber[] {
  const found: ImportedNumber[] = [];
  let spellLevel = 0;
  for (const count of slots) {
    spellLevel += 1;
    found.push({ name: slotLevelNameOf(spellLevel), value: knownIn(count, SPELL_SLOTS, working, character.route) });
  }
  return found;
}

export function slotsNotKnown(reason: string, character: RuleCharacter): readonly ImportedNumber[] {
  return [{ name: SPELL_SLOTS_NAME, value: notKnown(reason, character.route) }];
}
