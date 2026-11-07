import type { ItemChange } from "../notes/item-change";
import { unlink } from "../notes/link";
import type { ItemRecord, Source } from "./campaign";

function keyOf(name: string): string {
  return unlink(name).trim().toLowerCase();
}

export class ItemBook {
  private readonly byKey = new Map<string, ItemRecord>();

  get items(): ItemRecord[] {
    return [...this.byKey.values()];
  }

  name(item: string, holder: string, source: Source): void {
    const record = this.find(item);
    if (record === undefined) {
      this.add(item, holder, source).history.push({ kind: "named", holder, source });
      return;
    }
    if (holder !== "") record.holder = holder;
    record.gone = null;
    record.history.push({ kind: "named", holder: record.holder, source });
  }

  change(change: ItemChange, source: Source): void {
    const record = this.find(change.item) ?? this.add(change.item, "", source);
    if (change.holder !== undefined) record.holder = change.holder;
    const event = { kind: change.kind, holder: record.holder, source };
    record.history.push(event);
    if (change.kind !== "changed") record.gone = event;
  }

  private find(item: string): ItemRecord | undefined {
    return this.byKey.get(keyOf(item));
  }

  private add(item: string, holder: string, source: Source): ItemRecord {
    const record: ItemRecord = { name: unlink(item).trim(), holder, source, history: [], gone: null };
    this.byKey.set(keyOf(item), record);
    return record;
  }
}
