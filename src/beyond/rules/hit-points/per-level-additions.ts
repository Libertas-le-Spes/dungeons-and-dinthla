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

export function explanationOf(value: WorkedValue<number>): string {
  return value.explanation;
}

export function firstNotKnown(values: readonly WorkedValue<number>[]): WorkedValue<number> | undefined {
  return values.find((value) => !value.isKnown);
}

export function addedAmount(total: number, value: WorkedValue<number>): number {
  return total + value.valueOr(0);
}
