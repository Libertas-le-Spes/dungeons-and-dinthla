import type { NumberText } from "./number-text";

const WALKING_FEET = /^\d+ ?ft\.? ?(?:\(walking\)|walking)$/i;

export class FeetNumberText implements NumberText {
  numberIn(text: string): number | null {
    if (!WALKING_FEET.test(text)) return null;
    return Number.parseInt(text, 10);
  }
}
