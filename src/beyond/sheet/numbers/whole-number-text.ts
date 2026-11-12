import type { NumberText } from "./number-text";

const DIGITS = /^\d+$/;

export class WholeNumberText implements NumberText {
  numberIn(text: string): number | null {
    if (!DIGITS.test(text)) return null;
    return Number(text);
  }
}
