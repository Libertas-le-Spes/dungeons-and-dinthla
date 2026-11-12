import type { Route } from "./route";

export interface WorkedValue<T> {
  readonly route: Route;
  readonly isKnown: boolean;
  readonly explanation: string;
  valueOr(whenNotKnown: T): T;
}
