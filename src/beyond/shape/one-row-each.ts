import type { ImportedItem } from "./imported-item";
import { ITEM_COUNT } from "./import-limits";
import { NotKnownValue } from "./not-known-value";
import { numberInRange } from "./number-in-range";
import type { WorkedValue } from "./worked-value";

export const A_ROW_HAS_NO_COUNT = "One of the rows this count adds up has no count.";

function addedUpWords(rows: number): string {
  return `${rows} rows of it added up`;
}

function totalOf(first: ImportedItem, counts: readonly WorkedValue<number>[]): WorkedValue<number> {
  let total = 0;
  for (const count of counts) {
    if (!count.isKnown) return new NotKnownValue(A_ROW_HAS_NO_COUNT, first.count.route);
    total += count.valueOr(0);
  }
  return numberInRange(total, ITEM_COUNT, addedUpWords(counts.length), first.count.route);
}

interface SameName {
  readonly first: ImportedItem;
  readonly counts: WorkedValue<number>[];
}

function rowOf(same: SameName): ImportedItem {
  if (same.counts.length === 1) return same.first;
  return { name: same.first.name, count: totalOf(same.first, same.counts) };
}

export function oneRowEach(items: readonly ImportedItem[]): ImportedItem[] {
  const byName = new Map<string, SameName>();
  for (const item of items) {
    const same = byName.get(item.name.text);
    if (same === undefined) byName.set(item.name.text, { first: item, counts: [item.count] });
    else same.counts.push(item.count);
  }
  const rows: ImportedItem[] = [];
  for (const same of byName.values()) rows.push(rowOf(same));
  return rows;
}
