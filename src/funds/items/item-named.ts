import type { ItemRecord } from "../../campaign/record/campaign";

export function itemNamed(items: readonly ItemRecord[], name: string): ItemRecord | null {
  for (const item of items) {
    if (item.name === name) return item;
  }
  return null;
}
