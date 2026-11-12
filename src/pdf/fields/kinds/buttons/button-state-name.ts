import type { PdfValue } from "../../../values/pdf-value";
import { wrongFieldValue } from "../wrong-value";

const FIRST_PLAIN = 0x21;
const LAST_PLAIN = 0x7e;
export const OFF = "Off";

function isPlain(character: string): boolean {
  const code = character.charCodeAt(0);
  return code >= FIRST_PLAIN && code <= LAST_PLAIN;
}

export function buttonStateName(value: PdfValue): string {
  const name = value.asName();
  if (name === null || name === "") throw wrongFieldValue();
  for (const character of name) {
    if (!isPlain(character)) throw wrongFieldValue();
  }
  return name;
}
