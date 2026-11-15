import type { LeftOutCounts } from "./left-out-counts";

export function leftOutWordsOf(counts: LeftOutCounts): string | null {
  const parts: string[] = [];
  if (counts.tooLong > 0) parts.push(`${counts.tooLong} too long`);
  if (counts.notClean > 0) parts.push(`${counts.notClean} not clean`);
  if (parts.length === 0) return null;
  return `Left out: ${parts.join(", ")}.`;
}
