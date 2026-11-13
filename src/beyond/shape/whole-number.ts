export function isPlainWholeNumber(value: number): boolean {
  if (Object.is(value, -0)) return false;
  return Number.isInteger(value);
}
