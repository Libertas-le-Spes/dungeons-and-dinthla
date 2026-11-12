import { Refusal } from "./refusal";
import type { Route } from "./route";
import { isPlainWholeNumber } from "./whole-number";
import type { WorkedValue } from "./worked-value";

export class KnownValue implements WorkedValue<number> {
  readonly isKnown = true;

  private constructor(
    private readonly value: number,
    readonly explanation: string,
    readonly route: Route,
  ) {}

  static wholeNumber(value: number, explanation: string, route: Route): KnownValue {
    if (!isPlainWholeNumber(value)) throw new Refusal("A known number has to be a whole number.");
    return new KnownValue(value, explanation, route);
  }

  valueOr(): number {
    return this.value;
  }
}
