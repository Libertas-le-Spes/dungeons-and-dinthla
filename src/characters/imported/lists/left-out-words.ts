import type { LeftOutCounts } from "./left-out-counts";

function linesWords(count: number, what: string): string {
  if (count === 1) return `1 line ${what}`;
  return `${count} lines ${what}`;
}

export function leftOutWordsOf(counts: LeftOutCounts): string | null {
  const parts: string[] = [];
  if (counts.tooLong > 0) parts.push(linesWords(counts.tooLong, "too long to bring in"));
  if (counts.notClean > 0) parts.push(linesWords(counts.notClean, "that couldn't be read as plain text"));
  if (parts.length === 0) return null;
  return `Left out of the PDF's list: ${parts.join(" and ")}.`;
}
