export function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("The test expected a value and found none.");
  return value;
}
