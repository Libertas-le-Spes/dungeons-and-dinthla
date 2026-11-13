import { sameName } from "../core/same-name";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";

export function classesNamed(character: RuleCharacter, name: string): readonly RuleClass[] {
  const found: RuleClass[] = [];
  for (const ruleClass of character.classes) {
    if (sameName(ruleClass.name.text, name)) found.push(ruleClass);
  }
  return found;
}

export function hasClass(character: RuleCharacter, name: string): boolean {
  return classesNamed(character, name).length > 0;
}
