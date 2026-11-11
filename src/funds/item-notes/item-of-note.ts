import type { ItemRecord } from "../../campaign/record/campaign";
import { noteNameOf } from "../../campaign/paths/note-name";

export function isItemNamed(item: ItemRecord, name: string): boolean {
  return item.name.toLowerCase() === name.toLowerCase();
}

export function itemOfNote(items: ItemRecord[], path: string): ItemRecord | null {
  const name = noteNameOf(path);
  const item = items.find((candidate) => isItemNamed(candidate, name));
  if (item === undefined) return null;
  return item;
}
