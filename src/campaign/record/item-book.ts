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
  count: number | null;
  links: string[];
}

function isFresh(record: ItemRecord): boolean {
  return record.history.length === 0 || record.gone !== null;
}

function heldAfterGaining(record: ItemRecord, count: number | null): number | null {
  if (isFresh(record)) return count;
  if (record.held === null || count === null) return record.held;
  return record.held + count;
}

function takesSome(record: ItemRecord, change: ItemChange): boolean {
  if (change.kind === "changed" || isFresh(record)) return false;
  if (record.held === null || change.count === null) return false;
  return change.count < record.held;
}

export class ItemBook {
  private readonly byKey = new Map<string, ItemRecord>();

  get items(): ItemRecord[] {
    return [...this.byKey.values()];
  }

  mention({ item, count, holder, links, source }: ItemMention): void {
    const record = this.recordFor({ item, holder, source });
    keepWritten(record, item);
    record.held = heldAfterGaining(record, count);
    if (holder !== "") {
      record.holder = holder;
      record.holderLinked = true;
      record.links = links;
    }
    record.gone = null;
    record.history.push({ kind: "named", count, holder: record.holder, links, source });
  }

  change(change: ItemChange, source: Source): void {
    const record = this.recordFor({ item: change.item, holder: "", source });
    keepWritten(record, change.item);
    const partly = takesSome(record, change);
    if (change.kind === "changed" && isFresh(record)) record.held = change.count;
    if (partly && record.held !== null && change.count !== null) record.held -= change.count;
    if (change.holder !== undefined) {
      record.holder = change.holder;
      record.holderLinked = change.holderLinked === true;
      record.links = findLinks(change.text);
    }
    const event: ItemEvent = { kind: change.kind, count: change.count, holder: record.holder, links: findLinks(change.text), source };
    record.history.push(event);
    record.gone = null;
    if (change.kind !== "changed" && !partly) record.gone = event;
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
      held: null,
    };
    this.byKey.set(keyOf(item), added);
    return added;
  }
}
