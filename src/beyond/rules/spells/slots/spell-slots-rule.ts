import type { ImportedNumber } from "../../../shape/imported-number";
import { NotKnownValue } from "../../../shape/not-known-value";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import { unknownAmong } from "../../core/unknown-among";
import type { RuleCharacter } from "../../input/rule-character";
import { castingClassesOf } from "../casters/casting-class";
import type { CastingClass } from "../casters/casting-class";
import { standardSlotsOf } from "./standard-slots";

function contributes(casting: CastingClass): boolean {
  return casting.caster.kind.contributes;
}

export class SpellSlotsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const standard = castingClassesOf(character).filter(contributes);
    if (standard.length === 0) return [];
    const missing = unknownAmong(["Total level"], earlier, character.route);
    if (missing !== null) return [{ name: "Spell slots", value: new NotKnownValue(missing.explanation, character.route) }];
    return standardSlotsOf(character, standard);
  }
}
