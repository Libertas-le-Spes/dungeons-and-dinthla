import type { WorkedValue } from "../../shape/worked-value";
import type { RuleCharacter } from "../input/rule-character";
import { PER_LEVEL_SOURCES } from "./per-level-sources";

export function perLevelAdditions(character: RuleCharacter, totalLevel: number): readonly WorkedValue<number>[] {
  const found: WorkedValue<number>[] = [];
  for (const source of PER_LEVEL_SOURCES) {
    const addition = source.addition(character, totalLevel);
    if (addition !== null) found.push(addition);
  }
  return found;
}
