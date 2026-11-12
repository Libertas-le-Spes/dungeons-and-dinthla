export function firstOf<T>(list: readonly T[]): T {
  for (const entry of list) return entry;
  throw new Error("The list holds nothing.");
}
