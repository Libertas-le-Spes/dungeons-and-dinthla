import type { Route } from "./route";
import type { WorkedValue } from "./worked-value";

export class KnownValue<T> implements WorkedValue<T> {
  readonly isKnown = true;

  constructor(
    private readonly value: T,
    readonly explanation: string,
    readonly route: Route,
  ) {}

  valueOr(): T {
    return this.value;
  }
}
