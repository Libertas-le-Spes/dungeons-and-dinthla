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

export function lineAfter(text: string, line: string): string | undefined {
  const lines = linesOf(text);
  return lines[lines.indexOf(line) + 1];
}

export function linesFrom(text: string, line: string, count: number): string[] {
  const lines = linesOf(text);
  const start = lines.indexOf(line);
  return lines.slice(start, start + count);
}
