import type { ItemRecord } from "./campaign";

export function onePerItem(items: readonly ItemRecord[]): ItemRecord[] {
  const seen = new Set<string>();
  const firsts: ItemRecord[] = [];
  for (const item of items) {
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    firsts.push(item);
  }
  return firsts;
}
