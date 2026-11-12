import { KnownValue } from "../../../shape/known-value";
import type { ImportedNumber } from "../../../shape/imported-number";
import { NotKnownValue } from "../../../shape/not-known-value";
import type { RuleCharacter } from "../../input/rule-character";

export function slotNumbersFrom(slots: readonly number[], working: string, character: RuleCharacter): readonly ImportedNumber[] {
  const found: ImportedNumber[] = [];
  let spellLevel = 0;
  for (const count of slots) {
    spellLevel += 1;
    found.push({ name: `Spell slots level ${spellLevel}`, value: KnownValue.wholeNumber(count, working, character.route) });
  }
  return found;
}

export function slotsNotKnown(reason: string, character: RuleCharacter): readonly ImportedNumber[] {
  return [{ name: "Spell slots", value: new NotKnownValue(reason, character.route) }];
}
