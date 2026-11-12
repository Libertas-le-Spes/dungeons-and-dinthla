import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";

export function classesNamed(character: RuleCharacter, name: string): readonly RuleClass[] {
  return character.classes.filter((ruleClass) => ruleClass.name === name);
}

export function hasClass(character: RuleCharacter, name: string): boolean {
  return classesNamed(character, name).length > 0;
}
