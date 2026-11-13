import type { WorkedValue } from "../../../../beyond/shape/worked-value";
import { NOT_KNOWN_WORD } from "../../../layout/section-line-format";

const COUNT_NOT_KNOWN = "?";

export function valueTextOf(value: WorkedValue<number>): string {
  if (!value.isKnown) return NOT_KNOWN_WORD;
  return String(value.valueOr(0));
}

export function countTextOf(value: WorkedValue<number>): string {
  if (!value.isKnown) return COUNT_NOT_KNOWN;
  return String(value.valueOr(0));
}
