import { cleanTextOf, NEW_LINE } from "../../text/clean-text";
import type { CleanLine } from "../../text/clean-line";
import type { SheetFields } from "../sheet-fields";
import { lineOrNothing } from "./line-or-nothing";

function linesOf(text: string): readonly string[] {
  return cleanTextOf(text).split(NEW_LINE);
}

export function usableLines(texts: readonly string[]): readonly CleanLine[] {
  const found: CleanLine[] = [];
  for (const text of texts) {
    for (const line of linesOf(text)) {
      const usable = lineOrNothing(line);
      if (usable !== null) found.push(usable);
    }
  }
  return found;
}

export function printedTexts(fields: SheetFields, fieldNames: readonly string[]): readonly string[] {
  const texts: string[] = [];
  for (const name of fieldNames) {
    const text = fields.textAt(name);
    if (text !== null) texts.push(text);
  }
  return texts;
}
