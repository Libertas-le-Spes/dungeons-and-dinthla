import type { NotKnownValue } from "../../shape/not-known-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { unknownAmong } from "../core/unknown-among";
import type { RuleCharacter } from "../input/rule-character";
import type { CasterClass } from "./caster-class";

export interface CastingInputs {
  readonly missing: NotKnownValue<number> | null;
  readonly bonus: number;
  readonly modifier: number;
  readonly terms: readonly string[];
}

export function castingInputsOf(caster: CasterClass, character: RuleCharacter, earlier: EarlierNumbers): CastingInputs {
  const modifierName = `${caster.ability.short} modifier`;
  const missing = unknownAmong([modifierName, "Proficiency bonus"], earlier, character.route);
  const bonus = earlier.valueOf("Proficiency bonus", character.route).valueOr(0);
  const modifier = earlier.valueOf(modifierName, character.route).valueOr(0);
  return { missing, bonus, modifier, terms: [`proficiency ${bonus}`, `${caster.ability.short} ${modifier}`] };
}
