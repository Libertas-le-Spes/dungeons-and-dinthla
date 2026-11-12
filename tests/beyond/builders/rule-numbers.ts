import type { RuleCharacter } from "../../../src/beyond/rules/input/rule-character";
import { workedOut } from "../../../src/beyond/rules/worked-out";
import type { ImportedNumber } from "../../../src/beyond/shape/imported-number";
import type { WorkedValue } from "../../../src/beyond/shape/worked-value";

function isNamed(name: string): (number: ImportedNumber) => boolean {
  return function isNumberNamed(number: ImportedNumber): boolean {
    return number.name === name;
  };
}

function startsWith(start: string): (number: ImportedNumber) => boolean {
  return function isNumberStartingWith(number: ImportedNumber): boolean {
    return number.name.startsWith(start);
  };
}

function nameOf(number: ImportedNumber): string {
  return number.name;
}

function valueOf(number: ImportedNumber): number {
  return number.value.valueOr(-1);
}

function routeOf(number: ImportedNumber): unknown {
  return number.value.route;
}

function isKnown(number: ImportedNumber): boolean {
  return number.value.isKnown;
}

export function numberNamed(character: RuleCharacter, name: string): WorkedValue<number> {
  const found = workedOut(character).find(isNamed(name));
  if (found === undefined) throw new Error(`The rules worked out no number named ${name}.`);
  return found.value;
}

export function namesWorkedOut(character: RuleCharacter): string[] {
  return workedOut(character).map(nameOf);
}

export function namesStartingWith(character: RuleCharacter, start: string): string[] {
  return workedOut(character).filter(startsWith(start)).map(nameOf);
}

export function knownNamesWorkedOut(character: RuleCharacter): string[] {
  return workedOut(character).filter(isKnown).map(nameOf);
}

export function slotCounts(character: RuleCharacter): number[] {
  return workedOut(character).filter(startsWith("Spell slots level")).map(valueOf);
}

export function routesWorkedOut(character: RuleCharacter): unknown[] {
  return workedOut(character).map(routeOf);
}
