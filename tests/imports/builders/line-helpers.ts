export function linesOf(text: string): string[] {
  return text.split("\n");
}

export function textOf(...lines: string[]): string {
  return lines.join("\n");
}

function isEqualTo(wanted: string): (line: string) => boolean {
  return function equals(line: string): boolean {
    return line === wanted;
  };
}

function startsWith(prefix: string): (line: string) => boolean {
  return function starts(line: string): boolean {
    return line.toLowerCase().startsWith(prefix.toLowerCase());
  };
}

export function countOf(text: string, line: string): number {
  return linesOf(text).filter(isEqualTo(line)).length;
}

export function linesStartingWith(text: string, prefix: string): string[] {
  return linesOf(text).filter(startsWith(prefix));
}

export function headingsOf(text: string): string[] {
  return linesStartingWith(text, "## ");
}

export function positionOf(lines: readonly string[], line: string): number {
  const position = lines.indexOf(line);
  if (position === -1) throw new Error(`The text has no line ${JSON.stringify(line)}.`);
  return position;
}

export function lineAt(lines: readonly string[], wanted: number): string {
  for (const [position, line] of lines.entries()) {
    if (position === wanted) return line;
  }
  throw new Error(`There is no line at position ${wanted}.`);
}

export function lineAfter(text: string, line: string): string {
  const lines = linesOf(text);
  return lineAt(lines, positionOf(lines, line) + 1);
}

export function lineBefore(text: string, line: string): string {
  const lines = linesOf(text);
  return lineAt(lines, positionOf(lines, line) - 1);
}

export function linesFrom(text: string, line: string, count: number): string[] {
  const lines = linesOf(text);
  const start = positionOf(lines, line);
  const taken: string[] = [];
  for (const [position, entry] of lines.entries()) {
    if (position >= start && position < start + count) taken.push(entry);
  }
  return taken;
}

export function firstLines(lines: readonly string[], count: number): string[] {
  const taken: string[] = [];
  for (const [position, entry] of lines.entries()) {
    if (position < count) taken.push(entry);
  }
  return taken;
}

export function lastLineOf(lines: readonly string[]): string {
  return lineAt(lines, lines.length - 1);
}

export function manyLines(count: number): string {
  const lines: string[] = [];
  for (let position = 0; position < count; position += 1) lines.push(`Line ${position}`);
  return lines.join("\n");
}
