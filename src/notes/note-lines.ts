export function appendLines(text: string, lines: string[]): string {
  if (lines.length === 0) return text;
  const added = `${lines.join("\n")}\n`;
  if (text === "" || text.endsWith("\n")) return text + added;
  return `${text}\n${added}`;
}

export interface LineToRemove {
  line: number;
  matches: (written: string) => boolean;
}

function indexOf(lines: string[], target: LineToRemove, taken: Set<number>): number {
  const expected = lines[target.line];
  if (expected !== undefined && !taken.has(target.line) && target.matches(expected)) return target.line;
  return lines.findIndex((written, index) => !taken.has(index) && target.matches(written));
}

export function removeLines(text: string, targets: LineToRemove[]): { text: string; removed: number } {
  const lines = text.split("\n");
  const taken = new Set<number>();
  for (const target of targets) {
    const index = indexOf(lines, target, taken);
    if (index !== -1) taken.add(index);
  }
  const kept = lines.filter((_written, index) => !taken.has(index));
  return { text: kept.join("\n"), removed: taken.size };
}
