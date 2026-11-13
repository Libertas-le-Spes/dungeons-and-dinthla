import type { ImportedNumber } from "../../../shape/imported-number";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import { NeededNumbers } from "../../core/needed-numbers";
import { SPELL_SLOTS_NAME, TOTAL_LEVEL_NAME } from "../../core/number-names";
import type { Rule } from "../../core/rule";
import { SPELLCASTING_TOUCHING } from "../../core/touching-lists";
import type { RuleCharacter } from "../../input/rule-character";
import { castingClassesOf } from "../casters/casting-class";
import type { CastingClass } from "../casters/casting-class";
import { standardSlotsOf } from "./standard-slots";

function contributes(casting: CastingClass): boolean {
  return casting.caster.kind.contributes;
}

export class SpellSlotsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const touching = SPELLCASTING_TOUCHING.unknownFor(character);
    if (touching !== null) return [{ name: SPELL_SLOTS_NAME, value: touching }];
    const standard = castingClassesOf(character).filter(contributes);
    if (standard.length === 0) return [];
    const needed = NeededNumbers.of([TOTAL_LEVEL_NAME], earlier, character.route);
    if (needed.missing !== null) return [{ name: SPELL_SLOTS_NAME, value: needed.missing }];
    return standardSlotsOf(character, standard);
  }
}
