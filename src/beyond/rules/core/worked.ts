import { KnownValue } from "../../shape/known-value";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { NumberRange } from "../../shape/number-range";
import type { Route } from "../../shape/route";
import type { WorkedValue } from "../../shape/worked-value";
import { neutralWorking } from "./working-text";

export function knownIn(value: number, range: NumberRange, working: string, route: Route): WorkedValue<number> {
  return numberInRange(value, range, neutralWorking(working), route);
}

export function knownNumber(value: number, working: string, route: Route): WorkedValue<number> {
  return KnownValue.wholeNumber(value, neutralWorking(working), route);
}

export function notKnown(reason: string, route: Route): NotKnownValue<number> {
  return new NotKnownValue(neutralWorking(reason), route);
}
