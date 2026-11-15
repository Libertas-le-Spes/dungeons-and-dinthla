import { KnownValue } from "./known-value";
import { NotKnownValue } from "./not-known-value";
import type { NumberRange } from "./number-range";
import type { Route } from "./route";
import { isPlainWholeNumber } from "./whole-number";
import type { WorkedValue } from "./worked-value";

function isInside(value: number, range: NumberRange): boolean {
  if (value < range.lowest) return false;
  return value <= range.highest;
}

export function wholeNumberReason(range: NumberRange): string {
  return `Must be a whole number ${range.lowest} to ${range.highest}.`;
}

export function numberInRange(value: number, range: NumberRange, working: string, route: Route): WorkedValue<number> {
  if (isPlainWholeNumber(value) && isInside(value, range)) return KnownValue.wholeNumber(value, working, route);
  return new NotKnownValue(wholeNumberReason(range), route);
}
