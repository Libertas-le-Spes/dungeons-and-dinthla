import type { Route } from "./route";
import type { WorkedValue } from "./worked-value";

export class NotKnownValue<T> implements WorkedValue<T> {
  readonly isKnown = false;

  constructor(
    readonly explanation: string,
    readonly route: Route,
  ) {}

  valueOr(whenNotKnown: T): T {
    return whenNotKnown;
  }
}
