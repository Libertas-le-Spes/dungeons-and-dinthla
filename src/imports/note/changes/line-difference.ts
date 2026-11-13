const NOT_FOUND = -1;

export function linesWithout(lines: readonly string[], taking: readonly string[]): string[] {
  const remaining = [...taking];
  const left: string[] = [];
  for (const line of lines) {
    const at = remaining.indexOf(line);
    if (at === NOT_FOUND) left.push(line);
    else remaining.splice(at, 1);
  }
  return left;
}
