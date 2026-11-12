import type { WorkedValue } from "./worked-value";

export interface Purse {
  readonly platinum: WorkedValue<number>;
  readonly gold: WorkedValue<number>;
  readonly electrum: WorkedValue<number>;
  readonly silver: WorkedValue<number>;
  readonly copper: WorkedValue<number>;
}
