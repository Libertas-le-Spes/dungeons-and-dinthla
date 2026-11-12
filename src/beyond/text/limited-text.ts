import { characterCountOf } from "../shape/character-count";
import type { Cap } from "../shape/cap";
import { refuseAbove } from "../shape/refuse-above";

export function limitedText(text: string, cap: Cap): string {
  refuseAbove(cap, characterCountOf(text));
  return text;
}
