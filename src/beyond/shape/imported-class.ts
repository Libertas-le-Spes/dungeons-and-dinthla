import type { CleanLine } from "../text/clean-line";
import type { WorkedValue } from "./worked-value";

export interface ImportedClass {
  readonly name: CleanLine;
  readonly level: WorkedValue<number>;
}
