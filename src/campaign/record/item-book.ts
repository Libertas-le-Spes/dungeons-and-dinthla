import type { ItemChange } from "../../notes/reading/item-change";
import { findLinks, unlink } from "../../notes/parts/link";
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

function keepWritten(record: ItemRecord, item: string): void {
  const written = item.trim();
  if (written.includes("[[") || !record.written.includes("[[")) record.written = written;
}

interface ItemStart {
  item: string;
  holder: string;
  source: Source;
}

export interface ItemMention extends ItemStart {
  links: string[];
}

export class ItemBook {
  private readonly byKey = new Map<string, ItemRecord>();

  get items(): ItemRecord[] {
    return [...this.byKey.values()];
  }

  mention({ item, holder, links, source }: ItemMention): void {
    const record = this.recordFor({ item, holder, source });
    keepWritten(record, item);
    if (holder !== "") {
      record.holder = holder;
      record.holderLinked = true;
      record.links = links;
    }
    record.gone = null;
    record.history.push({ kind: "named", holder: record.holder, links, source });
  }

  change(change: ItemChange, source: Source): void {
    const record = this.recordFor({ item: change.item, holder: "", source });
    keepWritten(record, change.item);
    if (change.holder !== undefined) {
      record.holder = change.holder;
      record.holderLinked = change.holderLinked === true;
      record.links = findLinks(change.text);
    }
    const event: ItemEvent = { kind: change.kind, holder: record.holder, links: findLinks(change.text), source };
    record.history.push(event);
    record.gone = null;
    if (change.kind !== "changed") record.gone = event;
  }

  private recordFor({ item, holder, source }: ItemStart): ItemRecord {
    const found = this.byKey.get(keyOf(item));
    if (found !== undefined) return found;
    const added: ItemRecord = {
      name: nameOf(item),
      written: item.trim(),
      holder,
      holderLinked: false,
      links: [],
      source,
      history: [],
      gone: null,
    };
    this.byKey.set(keyOf(item), added);
    return added;
  }
}
