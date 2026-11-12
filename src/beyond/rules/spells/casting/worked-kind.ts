import type { NumberRange } from "../../../shape/number-range";

export interface WorkedKind {
  readonly names: readonly string[];
  readonly range: NumberRange;
  readonly start: number;
  readonly startTerms: readonly string[];
}
