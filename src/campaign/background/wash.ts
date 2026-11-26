export const WASHES = ["subtle", "balanced", "strong"] as const;
export type Wash = (typeof WASHES)[number];
export const DEFAULT_WASH: Wash = "balanced";

export function washOf(value: unknown): Wash {
  for (const wash of WASHES) {
    if (value === wash) return wash;
  }
  return DEFAULT_WASH;
}
