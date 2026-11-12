export function firstOf<T>(list: readonly T[]): T | undefined {
  for (const item of list) return item;
  return undefined;
}
