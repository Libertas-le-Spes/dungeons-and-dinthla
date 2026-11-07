import type { ItemChange } from "../notes/item-change";
import { findLinks, unlink } from "../notes/link";
import type { ItemEvent, ItemRecord, Source } from "./campaign";

const ONE_LINK = /^\[\[[^[\]]+\]\]$/;

function nameOf(item: string): string {
  const written = item.trim();
  if (!ONE_LINK.test(written)) return unlink(written).replace(/\s+/g, " ").trim();
  const [target] = findLinks(written);
  return target!.slice(target!.lastIndexOf("/") + 1).replace(/\.md$/i, "");
}

function keyOf(item: string): string {
  return nameOf(item).toLowerCase();
}

export class ItemBook {
  private readonly byKey = new Map<string, ItemRecord>();

  get items(): ItemRecord[] {
    return [...this.byKey.values()];
  }

  mention(item: string, holder: string, source: Source): void {
    const record = this.recordFor(item, holder, source);
    if (holder !== "") record.holder = holder;
    record.gone = null;
    record.history.push({ kind: "named", holder: record.holder, source });
  }

  change(change: ItemChange, source: Source): void {
    const record = this.recordFor(change.item, "", source);
    if (change.holder !== undefined) record.holder = change.holder;
    const event: ItemEvent = { kind: change.kind, holder: record.holder, source };
    record.history.push(event);
    record.gone = null;
    if (change.kind !== "changed") record.gone = event;
  }

  private recordFor(item: string, holder: string, source: Source): ItemRecord {
    const found = this.byKey.get(keyOf(item));
    if (found !== undefined) return found;
    const added: ItemRecord = { name: nameOf(item), holder, source, history: [], gone: null };
    this.byKey.set(keyOf(item), added);
    return added;
  }
}
