export function numberedNames(prefix: string, first: number, last: number): readonly string[] {
  const names: string[] = [];
  for (let number = first; number <= last; number += 1) names.push(`${prefix}${number}`);
  return names;
}
