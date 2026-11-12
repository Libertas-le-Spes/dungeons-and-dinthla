export function paired<T>(first: T[], second: T[]): [T, T][] | null {
  if (first.length !== second.length) return null;
  const others = second.values();
  const pairs: [T, T][] = [];
  for (const one of first) {
    const other = others.next();
    if (other.done) return null;
    pairs.push([one, other.value]);
  }
  return pairs;
}
