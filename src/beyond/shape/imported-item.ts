import type { CleanLine } from "../text/clean-line";
import type { WorkedValue } from "./worked-value";

export interface ImportedItem {
  readonly name: CleanLine;
  readonly count: WorkedValue<number>;
}
