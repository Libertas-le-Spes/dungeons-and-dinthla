import type { LineLoss } from "../../../beyond/sheet/lines/line-loss";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportedClass } from "../../../beyond/shape/imported-class";
import { NOT_IN_THE_PDF } from "../import-words";

const BETWEEN_PARTS = " · ";
const BETWEEN_CLASSES = " / ";

function classWords(imported: ImportedClass): string {
  if (!imported.level.isKnown) return imported.name.text;
  return `${imported.name.text} ${imported.level.valueOr(0)}`;
}

function identityLine(sheet: PrintedSheet): string {
  const classes: string[] = [];
  for (const imported of sheet.character.classes) classes.push(classWords(imported));
  const parts = [sheet.character.species.text];
  if (classes.length > 0) parts.push(classes.join(BETWEEN_CLASSES));
  return parts.join(BETWEEN_PARTS);
}

function countWords(count: number, one: string, many: string): string {
  if (count === 1) return `1 ${one}`;
  return `${count} ${many}`;
}

function listsLine(sheet: PrintedSheet): string {
  const character = sheet.character;
  return [countWords(character.inventory.length, "item", "items"), countWords(character.spells.length, "spell", "spells"), countWords(character.features.length, "feature line", "feature lines")].join(BETWEEN_PARTS);
}

function lossWords(what: string, loss: LineLoss): string | null {
  if (loss.tooLong + loss.notClean === 0) return null;
  return `Left out of the ${what}: ${loss.tooLong} too long, ${loss.notClean} not clean.`;
}

function leftOutLines(sheet: PrintedSheet): string[] {
  const lines: string[] = [];
  for (const words of [lossWords("items", sheet.leftOut.items), lossWords("spells", sheet.leftOut.spells), lossWords("features", sheet.leftOut.features)]) {
    if (words !== null) lines.push(words);
  }
  return lines;
}

export function summaryLinesOf(sheet: PrintedSheet): string[] {
  return [identityLine(sheet), listsLine(sheet), ...leftOutLines(sheet), NOT_IN_THE_PDF];
}
