import { markerStartOf } from "../parts/bullet";

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

const NEW_LINE = "\n";

export function insertLineAt(text: string, at: number, line: string): string {
  const carriage = lineBreakOf(text).replace(NEW_LINE, "");
  const lines: string[] = [];
  for (const [index, written] of text.split(NEW_LINE).entries()) {
    if (index === at) lines.push(`${line}${carriage}`);
    lines.push(written);
  }
  return lines.join(NEW_LINE);
}

export interface LineToRemove {
  line: number;
  matches: (written: string) => boolean;
}

function theLineOf(lines: string[], target: LineToRemove): number {
  const written = lines[target.line];
  if (written === undefined || !target.matches(written.replace(/\r$/, ""))) return -1;
  return target.line;
}

export function removeLines(text: string, targets: LineToRemove[]): { text: string; removed: number } {
  const lines = text.split("\n");
  const taken = new Set<number>();
  for (const target of targets) {
    const index = theLineOf(lines, target);
    if (index !== -1) taken.add(index);
  }
  const kept = lines.filter((_written, index) => !taken.has(index));
  const lastKept = kept.length - 1;
  if (taken.has(lines.length - 1) && lastKept >= 0) kept[lastKept] = kept[lastKept]!.replace(/\r$/, "");
  return { text: kept.join("\n"), removed: taken.size };
}

export function rewriteLine(text: string, target: LineToRemove, line: string): string | null {
  const lines = text.split("\n");
  const index = theLineOf(lines, target);
  if (index === -1) return null;
  const old = lines[index]!;
  let ending = "";
  if (old.endsWith("\r")) ending = "\r";
  lines[index] = `${old.slice(0, markerStartOf(old))}${line}${ending}`;
  return lines.join("\n");
}

export function dropLine(text: string, target: LineToRemove): string | null {
  const index = theLineOf(text.split("\n"), target);
  if (index === -1) return null;
  return removeLines(text, [{ line: index, matches: target.matches }]).text;
}
