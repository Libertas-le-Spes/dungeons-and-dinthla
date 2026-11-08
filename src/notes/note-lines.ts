import { markerStartOf } from "./bullet";

function lineBreakOf(text: string): string {
  if (text.includes("\r\n")) return "\r\n";
  return "\n";
}

export function appendLines(text: string, lines: string[]): string {
  if (lines.length === 0) return text;
  const lineBreak = lineBreakOf(text);
  const added = `${lines.join(lineBreak)}${lineBreak}`;
  if (text === "" || text.endsWith("\n")) return text + added;
  return `${text}${lineBreak}${added}`;
}

export interface LineToRemove {
  line: number;
  matches: (written: string) => boolean;
}

function nearestMatch(lines: string[], target: LineToRemove, taken: Set<number>): number {
  let nearest = -1;
  lines.forEach((written, index) => {
    if (taken.has(index) || !target.matches(written.replace(/\r$/, ""))) return;
    if (nearest === -1 || Math.abs(index - target.line) < Math.abs(nearest - target.line)) nearest = index;
  });
  return nearest;
}

export function removeLines(text: string, targets: LineToRemove[]): { text: string; removed: number } {
  const lines = text.split("\n");
  const taken = new Set<number>();
  for (const target of targets) {
    const index = nearestMatch(lines, target, taken);
    if (index !== -1) taken.add(index);
  }
  const kept = lines.filter((_written, index) => !taken.has(index));
  const lastKept = kept.length - 1;
  if (taken.has(lines.length - 1) && lastKept >= 0) kept[lastKept] = kept[lastKept]!.replace(/\r$/, "");
  return { text: kept.join("\n"), removed: taken.size };
}

export function rewriteLine(text: string, target: LineToRemove, line: string): string | null {
  const lines = text.split("\n");
  const index = nearestMatch(lines, target, new Set());
  if (index === -1) return null;
  const old = lines[index]!;
  let ending = "";
  if (old.endsWith("\r")) ending = "\r";
  lines[index] = `${old.slice(0, markerStartOf(old))}${line}${ending}`;
  return lines.join("\n");
}
