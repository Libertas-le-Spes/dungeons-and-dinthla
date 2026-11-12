import type { ImportedNumber } from "../../../shape/imported-number";
import { SPELL_SLOTS } from "../../../shape/import-limits";
import { classesNamed } from "../../classes/has-class";
import { WARLOCK_NAME } from "../../classes/class-names";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import { firstFound } from "../../core/first-found";
import { NeededNumbers } from "../../core/needed-numbers";
import { PACT_SLOTS_NAME, PACT_SLOT_LEVEL_NAME, TOTAL_LEVEL_NAME } from "../../core/number-names";
import type { Rule } from "../../core/rule";
import { knownIn, notKnown } from "../../core/worked";
import type { RuleCharacter } from "../../input/rule-character";
import { PACT_SLOTS } from "./tables/pact-slots";

function pactNotKnown(reason: string, character: RuleCharacter): readonly ImportedNumber[] {
  return [{ name: PACT_SLOTS_NAME, value: notKnown(reason, character.route) }];
}

function rowFor(level: number): (candidate: { readonly level: number }) => boolean {
  return function isRow(candidate: { readonly level: number }): boolean {
    return candidate.level === level;
  };
}

export class PactSlotsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const warlock = firstFound(classesNamed(character, WARLOCK_NAME));
    if (warlock === undefined) return [];
    const needed = NeededNumbers.of([TOTAL_LEVEL_NAME], earlier, character.route);
    if (needed.missing !== null) return pactNotKnown(needed.missing.explanation, character);
    const row = PACT_SLOTS.find(rowFor(warlock.level));
    if (row === undefined) return pactNotKnown("The warlock level is not in the pact slot table.", character);
    const working = `Warlock ${warlock.level}: ${row.count} slots of level ${row.slotLevel}`;
    return [
      { name: PACT_SLOTS_NAME, value: knownIn(row.count, SPELL_SLOTS, working, character.route) },
      { name: PACT_SLOT_LEVEL_NAME, value: knownIn(row.slotLevel, SPELL_SLOTS, working, character.route) },
    ];
  }
}
