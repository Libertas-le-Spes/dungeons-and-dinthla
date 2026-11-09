export interface BoxLine {
  index: number;
  text: string;
}

function lineIndexAt(text: string, caret: number): number {
  return text.slice(0, caret).split("\n").length - 1;
}

export function lineAt(text: string, caret: number): BoxLine {
  const index = lineIndexAt(text, caret);
  const line = text.split("\n")[index];
  if (line === undefined) return { index, text: "" };
  return { index, text: line };
}

export function withoutLine(text: string, index: number): string {
  const lines = text.split("\n");
  lines.splice(index, 1);
  return lines.join("\n");
}

export function startOfLine(text: string, index: number): number {
  let start = 0;
  for (const line of text.split("\n").slice(0, index)) start += line.length + 1;
  return Math.min(start, text.length);
}
