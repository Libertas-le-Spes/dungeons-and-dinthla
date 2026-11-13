export function firstOf<T>(list: readonly T[]): T {
  const [first] = list;
  if (first === undefined) throw new Error("The list is empty.");
  return first;
}

export function secondOf<T>(list: readonly T[]): T {
  const [, second] = list;
  if (second === undefined) throw new Error("The list has no second item.");
  return second;
}
