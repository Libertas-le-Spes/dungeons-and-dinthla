import type { NotKnownValue } from "../../../shape/not-known-value";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import { NeededNumbers } from "../../core/needed-numbers";
import { PROFICIENCY_BONUS_NAME } from "../../core/number-names";
import type { RuleCharacter } from "../../input/rule-character";
import type { CasterClass } from "../casters/caster-class";

export interface CastingInputs {
  readonly missing: NotKnownValue<number> | null;
  readonly bonus: number;
  readonly modifier: number;
  readonly terms: readonly string[];
}

const NOTHING = { bonus: 0, modifier: 0, terms: [] };

export function castingInputsOf(caster: CasterClass, character: RuleCharacter, earlier: EarlierNumbers): CastingInputs {
  const modifierName = caster.ability.modifierName;
  const needed = NeededNumbers.of([modifierName, PROFICIENCY_BONUS_NAME], earlier, character.route);
  if (needed.missing !== null) return { missing: needed.missing, ...NOTHING };
  const bonus = needed.numberOf(PROFICIENCY_BONUS_NAME);
  const modifier = needed.numberOf(modifierName);
  return { missing: null, bonus, modifier, terms: [`proficiency ${bonus}`, `${caster.ability.short} ${modifier}`] };
}
