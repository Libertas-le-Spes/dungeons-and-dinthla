export function numericOf(found: number | null): number {
  if (found === null) return Number.NaN;
  return found;
}
