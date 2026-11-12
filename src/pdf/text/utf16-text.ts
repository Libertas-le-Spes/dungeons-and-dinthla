import { unreadableText } from "./unreadable-text";

const HIGH_START = 0xd800;
const HIGH_END = 0xdbff;
const LOW_START = 0xdc00;
const LOW_END = 0xdfff;

function isHighSurrogate(unit: number): boolean {
  return unit >= HIGH_START && unit <= HIGH_END;
}

function isLowSurrogate(unit: number): boolean {
  return unit >= LOW_START && unit <= LOW_END;
}

export function utf16TextOf(units: number[]): string {
  let text = "";
  let waitingFor: number | null = null;
  for (const unit of units) {
    if (waitingFor !== null && !isLowSurrogate(unit)) throw unreadableText();
    if (waitingFor === null && isLowSurrogate(unit)) throw unreadableText();
    if (isHighSurrogate(unit)) waitingFor = unit;
    else waitingFor = null;
    text += String.fromCharCode(unit);
  }
  if (waitingFor !== null) throw unreadableText();
  return text;
}
