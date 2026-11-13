import type { NumberText } from "./number-text";

const SIGNED_DIGITS = /^[+-]?\d+$/;

export class SignedNumberText implements NumberText {
  numberIn(text: string): number | null {
    if (!SIGNED_DIGITS.test(text)) return null;
    return Number(text);
  }
}
