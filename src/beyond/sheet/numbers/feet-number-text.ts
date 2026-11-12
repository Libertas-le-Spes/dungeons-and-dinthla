import type { NumberText } from "./number-text";

const WALKING_FEET = /^\d+ ?ft\.? ?\(?walking\)?$/i;
const FROM_THE_UNIT = /\D.*$/su;

export class FeetNumberText implements NumberText {
  numberIn(text: string): number | null {
    if (!WALKING_FEET.test(text)) return null;
    return Number(text.replace(FROM_THE_UNIT, ""));
  }
}
