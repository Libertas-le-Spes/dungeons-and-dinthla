import type { ItemRecord, Source } from "../../campaign/record/campaign";

export function itemNamed(items: readonly ItemRecord[], name: string): ItemRecord | null {
  for (const item of items) {
    if (item.name === name) return item;
  }
  return null;
}

function isAt(found: Source, wanted: Source): boolean {
  return found.path === wanted.path && found.line === wanted.line;
}

function holdsLine(item: ItemRecord, source: Source): boolean {
  if (isAt(item.source, source)) return true;
  return item.gone !== null && isAt(item.gone.source, source);
}

export function itemNamedAt(items: readonly ItemRecord[], name: string, source: Source | null): ItemRecord | null {
  if (source === null) return itemNamed(items, name);
  for (const item of items) {
    if (item.name === name && holdsLine(item, source)) return item;
  }
  return itemNamed(items, name);
}
