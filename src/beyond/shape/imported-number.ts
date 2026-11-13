import type { WorkedValue } from "./worked-value";

export interface ImportedNumber {
  readonly name: string;
  readonly value: WorkedValue<number>;
}
