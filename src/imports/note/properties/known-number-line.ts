import type { WorkedValue } from "../../../beyond/shape/worked-value";

export function knownNumberLineOf(name: string, value: WorkedValue<number>): string | null {
  if (!value.isKnown) return null;
  return `${name}: ${value.valueOr(0)}`;
}
