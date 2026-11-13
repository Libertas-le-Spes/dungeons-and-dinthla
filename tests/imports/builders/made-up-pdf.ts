import type { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { FormDocument } from "../../pdf/writer/documents/form-document";
import { utf16Hex } from "../../pdf/writer/pdf-text";

const CHECKED = "/Yes";
const NOT_CHECKED = "/Off";

function checkName(on: boolean): string {
  if (on) return CHECKED;
  return NOT_CHECKED;
}

export function madeUpPdf(sheet: MadeUpSheet): Uint8Array {
  const form = new FormDocument();
  for (const [name, value] of sheet.fields()) {
    if (typeof value === "string") form.text(name, utf16Hex(value));
    if (typeof value === "boolean") form.check(name, checkName(value));
  }
  return new Uint8Array(form.classic());
}

export function notAPdf(): Uint8Array {
  return new TextEncoder().encode("Plain words, not a PDF.");
}
