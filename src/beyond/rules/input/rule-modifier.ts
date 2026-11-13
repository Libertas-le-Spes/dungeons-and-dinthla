import type { CleanLine } from "../../text/clean-line";

export interface RuleModifier {
  readonly type: string;
  readonly subType: CleanLine;
  readonly value: number | null;
  readonly restriction: string;
  readonly sourceName: CleanLine;
  readonly inForce: boolean;
}
