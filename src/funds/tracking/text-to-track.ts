import type { ItemRecord } from "../../campaign/record/campaign";
import { isInertWritten } from "../../characters/imported/lists/inert-written";
import { itemKeyOf, storedItemKeyOf } from "../../characters/imported/lists/item-key";

export function textToTrack(items: readonly ItemRecord[], written: string): string | null {
  const key = itemKeyOf(written);
  for (const item of items) {
    if (storedItemKeyOf(item.name) !== key) continue;
    if (isInertWritten(item.written)) return item.written;
    return null;
  }
  return written;
}
