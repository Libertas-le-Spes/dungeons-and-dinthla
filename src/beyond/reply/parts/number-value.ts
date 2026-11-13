import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { NumberRange } from "../../shape/number-range";
import type { WorkedValue } from "../../shape/worked-value";
import { ONLINE } from "../common/online-route";

export function numberValueOf(found: number | null, range: NumberRange, label: string): WorkedValue<number> {
  if (found === null) return new NotKnownValue(`${range.what} is missing or is not a number.`, ONLINE);
  return numberInRange(found, range, `${label}: ${found}`, ONLINE);
}
