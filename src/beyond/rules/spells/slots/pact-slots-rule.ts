import type { ImportedNumber } from "../../../shape/imported-number";
import { KnownValue } from "../../../shape/known-value";
import { NotKnownValue } from "../../../shape/not-known-value";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import { unknownAmong } from "../../core/unknown-among";
import { classesNamed } from "../../classes/has-class";
import { firstOf } from "../../core/first-of";
import type { RuleCharacter } from "../../input/rule-character";
import { PACT_SLOTS } from "./tables/pact-slots";

export class PactSlotsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const warlock = firstOf(classesNamed(character, "Warlock"));
    if (warlock === undefined) return [];
    const missing = unknownAmong(["Total level"], earlier, character.route);
    if (missing !== null) return [{ name: "Pact slots", value: new NotKnownValue(missing.explanation, character.route) }];
    const row = PACT_SLOTS.find((candidate) => candidate.level === warlock.level);
    if (row === undefined) return [{ name: "Pact slots", value: new NotKnownValue("The warlock level is not in the pact slot table.", character.route) }];
    const working = `Warlock ${warlock.level}: ${row.count} slots of level ${row.slotLevel}`;
    return [
      { name: "Pact slots", value: KnownValue.wholeNumber(row.count, working, character.route) },
      { name: "Pact slot level", value: KnownValue.wholeNumber(row.slotLevel, working, character.route) },
    ];
  }
}
