import type { ItemRecord } from "../../campaign/record/campaign";
import { itemKeyOf, storedItemKeyOf } from "../../characters/imported/lists/item-key";

export function textToTrack(items: readonly ItemRecord[], written: string): string {
  const key = itemKeyOf(written);
  for (const item of items) {
    if (storedItemKeyOf(item.name) === key) return item.written;
  }
  return written;
}
