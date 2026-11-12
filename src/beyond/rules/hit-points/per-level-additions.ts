import type { WorkedValue } from "../../shape/worked-value";
import type { RuleCharacter } from "../input/rule-character";
import { PER_LEVEL_SOURCES } from "./per-level-sources";

function isNotKnown(value: WorkedValue<number>): boolean {
  return !value.isKnown;
}

export function perLevelAdditions(character: RuleCharacter, totalLevel: number): readonly WorkedValue<number>[] {
  const found: WorkedValue<number>[] = [];
  for (const source of PER_LEVEL_SOURCES) {
    const addition = source.addition(character, totalLevel);
    if (addition !== null) found.push(addition);
  }
  return found;
}

export function addedSourceNames(character: RuleCharacter, totalLevel: number): readonly string[] {
  const found: string[] = [];
  for (const source of PER_LEVEL_SOURCES) {
    if (source.addition(character, totalLevel) !== null) found.push(source.sourceName);
  }
  return found;
}

export function firstNotKnown(values: readonly WorkedValue<number>[]): WorkedValue<number> | undefined {
  return values.find(isNotKnown);
}

export function explanationOf(value: WorkedValue<number>): string {
  return value.explanation;
}

export function addedAmount(total: number, value: WorkedValue<number>): number {
  return total + value.valueOr(0);
}
