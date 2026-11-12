import type { CleanLine } from "../../text/clean-line";

export interface RuleClass {
  readonly name: CleanLine;
  readonly subclass: string;
  readonly level: number;
  readonly hitDie: number;
}
