import type { CleanLine } from "../../text/clean-line";

export function uniqueLines(lines: readonly CleanLine[]): readonly CleanLine[] {
  const seen = new Set<string>();
  const kept: CleanLine[] = [];
  for (const line of lines) {
    if (seen.has(line.text)) continue;
    seen.add(line.text);
    kept.push(line);
  }
  return kept;
}
