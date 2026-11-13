import type { RuleCharacter } from "../input/rule-character";
import { sameName } from "./same-name";

export function hasFeature(character: RuleCharacter, name: string): boolean {
  for (const feature of character.features) {
    if (sameName(feature, name)) return true;
  }
  return false;
}
