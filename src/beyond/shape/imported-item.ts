import type { WorkedValue } from "./worked-value";

export interface ImportedItem {
  readonly name: string;
  readonly count: WorkedValue<number>;
}
