const LINE_BREAK = "\n";
const CARRIAGE_RETURN = "\r";

export function noteLinesOf(text: string): string[] {
  const lines: string[] = [];
  for (const line of text.split(LINE_BREAK)) lines.push(withoutCarriageReturn(line));
  return lines;
}

function withoutCarriageReturn(line: string): string {
  if (!line.endsWith(CARRIAGE_RETURN)) return line;
  return line.substring(0, line.length - CARRIAGE_RETURN.length);
}
