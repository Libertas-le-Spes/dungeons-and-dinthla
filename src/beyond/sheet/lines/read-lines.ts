import type { CleanLine } from "../../text/clean-line";
import type { LineLoss } from "./line-loss";

export interface ReadLines {
  readonly lines: readonly CleanLine[];
  readonly loss: LineLoss;
}
