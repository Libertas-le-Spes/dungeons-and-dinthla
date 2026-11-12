import { characterCountOf } from "../shape/character-count";
import type { Cap } from "../shape/cap";
import { overTheLimit } from "../shape/refusal";
import { refuseAbove } from "../shape/refuse-above";

const MOST_UNITS_PER_CHARACTER = 2;

function isTooLongInUnits(text: string, cap: Cap): boolean {
  return text.length > cap.most * MOST_UNITS_PER_CHARACTER;
}

export function limitedText(text: string, cap: Cap): string {
  if (isTooLongInUnits(text, cap)) throw overTheLimit(cap);
  refuseAbove(cap, characterCountOf(text));
  return text;
}
