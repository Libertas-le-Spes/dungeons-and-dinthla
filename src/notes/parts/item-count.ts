const COUNT_AT_END = /^(.*\S)\s+[x×]\s?([1-9]\d{0,3})$/i;

export interface CountedItem {
  readonly item: string;
  readonly count: number | null;
}

export function countedItemOf(written: string): CountedItem {
  const match = COUNT_AT_END.exec(written);
  if (match === null) return { item: written, count: null };
  const [, item, digits] = match;
  if (item === undefined || digits === undefined) return { item: written, count: null };
  return { item, count: Number(digits) };
}

export function countTextOf(count: number | null): string {
  if (count === null) return "";
  return ` x${count}`;
}
