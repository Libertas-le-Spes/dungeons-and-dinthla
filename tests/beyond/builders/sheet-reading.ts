import type { ImportedCharacter } from "../../../src/beyond/shape/imported-character";
import type { ImportedNumber } from "../../../src/beyond/shape/imported-number";
import { readPrintedSheet } from "../../../src/beyond/sheet/read-printed-sheet";
import type { PrintedSheet } from "../../../src/beyond/sheet/printed-sheet";
import type { MadeUpSheet } from "./made-up-sheet";

export function printedOf(sheet: MadeUpSheet): PrintedSheet {
  return readPrintedSheet(sheet.fields());
}

export function readOf(sheet: MadeUpSheet): ImportedCharacter {
  return printedOf(sheet).character;
}

export function nameOf(number: { name: string }): string {
  return number.name;
}

export function textOf(line: { text: string }): string {
  return line.text;
}

export function isNotKnown(number: ImportedNumber): boolean {
  return !number.value.isKnown;
}

export function isNamed(name: string): (number: ImportedNumber) => boolean {
  return function named(number: ImportedNumber): boolean {
    return number.name === name;
  };
}

export function unknownNames(character: ImportedCharacter): string[] {
  return character.numbers.filter(isNotKnown).map(nameOf);
}

export function valueNamed(character: ImportedCharacter, name: string): number {
  const found = character.numbers.find(isNamed(name));
  if (found === undefined) throw new Error(`The character has no number called ${name}.`);
  return found.value.valueOr(Number.NaN);
}

export function textsOf(lines: readonly { text: string }[]): string[] {
  return lines.map(textOf);
}

export function manyLines(count: number, word = "Line"): string {
  const lines: string[] = [];
  for (let position = 0; position < count; position += 1) lines.push(`${word} ${position}`);
  return lines.join("\n");
}
