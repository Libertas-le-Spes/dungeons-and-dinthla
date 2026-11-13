import type { WorkedValue } from "./worked-value";

export interface ImportedClass {
  readonly name: string;
  readonly level: WorkedValue<number>;
}
