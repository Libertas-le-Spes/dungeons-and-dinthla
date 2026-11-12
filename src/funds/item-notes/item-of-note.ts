import type { ItemRecord } from "../../campaign/record/campaign";
import { noteNameOf } from "../../campaign/paths/note-name";
import { itemFileNameOf } from "./item-file-name";

export function isItemNamed(item: ItemRecord, name: string): boolean {
  return item.name.toLowerCase() === name.toLowerCase();
}

export function hasNoteNamed(item: ItemRecord, noteName: string): boolean {
  return itemFileNameOf(item.name).toLowerCase() === noteName.toLowerCase();
}

export function itemOfNote(items: ItemRecord[], path: string): ItemRecord | null {
  const noteName = noteNameOf(path);
  const item = items.find((candidate) => hasNoteNamed(candidate, noteName));
  if (item === undefined) return null;
  return item;
}
