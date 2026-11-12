import type { Route } from "../shape/route";
import { KnownValue } from "../shape/known-value";
import { NotKnownValue } from "../shape/not-known-value";
import type { NumberRange } from "../shape/number-range";
import type { WorkedValue } from "../shape/worked-value";

function isPlainWholeNumber(value: number): boolean {
  if (Object.is(value, -0)) return false;
  return Number.isInteger(value);
}

function isInside(value: number, range: NumberRange): boolean {
  if (value < range.lowest) return false;
  return value <= range.highest;
}

function reasonFor(range: NumberRange): string {
  return `${range.what} has to be a whole number from ${range.lowest} to ${range.highest}.`;
}

export function numberInRange(value: number, range: NumberRange, working: string, route: Route): WorkedValue<number> {
  if (isPlainWholeNumber(value) && isInside(value, range)) return new KnownValue(value, working, route);
  return new NotKnownValue(reasonFor(range), route);
}
