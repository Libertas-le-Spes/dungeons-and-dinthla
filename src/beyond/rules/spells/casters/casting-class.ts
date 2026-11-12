import type { RuleCharacter } from "../../input/rule-character";
import type { RuleClass } from "../../input/rule-class";
import type { CasterClass } from "./caster-class";
import { CASTER_CLASSES } from "./caster-classes";

export interface CastingClass {
  readonly caster: CasterClass;
  readonly ruleClass: RuleClass;
}

export function castingClassesOf(character: RuleCharacter): readonly CastingClass[] {
  const found: CastingClass[] = [];
  for (const ruleClass of character.classes) {
    for (const caster of CASTER_CLASSES) {
      if (caster.matches(ruleClass)) found.push({ caster, ruleClass });
    }
  }
  return found;
}
