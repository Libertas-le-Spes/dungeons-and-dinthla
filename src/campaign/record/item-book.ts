import type { ItemChange } from "../../notes/reading/item-change";
import { findLinks, unlink } from "../../notes/parts/link";
import type { ItemEvent, ItemRecord, Source } from "./campaign";
import { holderKeyOf } from "./holder-key";
import { ItemHoldings } from "./item-holdings";

const ONE_LINK = /^\[\[[^[\]]+\]\]$/;
const NO_COUNT_IS_ONE = 1;

function nameOf(item: string): string {
  const written = item.trim();
  if (!ONE_LINK.test(written)) return unlink(written).replace(/\s+/g, " ").trim();
  const [target] = findLinks(written);
  return target!.slice(target!.lastIndexOf("/") + 1).replace(/\.md$/i, "");
}

function keyOf(item: string): string {
  return nameOf(item).toLowerCase();
}

function targetOf(change: ItemChange): string {
  if (change.holder === undefined) return "";
  return change.holder;
}

function countOf(count: number | null): number {
  if (count === null) return NO_COUNT_IS_ONE;
  return count;
}

export interface ItemMention {
  item: string;
  count: number | null;
  holder: string;
  links: string[];
  source: Source;
}

interface ChangedItem {
  readonly item: string;
  readonly named: readonly string[];
}

interface Move {
  readonly holdings: ItemHoldings;
  readonly from: ItemRecord;
  readonly change: ItemChange;
  readonly event: ItemEvent;
}

export class ItemBook {
  private readonly byKey = new Map<string, ItemHoldings>();

  get items(): ItemRecord[] {
    const records: ItemRecord[] = [];
    for (const holdings of this.byKey.values()) records.push(...holdings.records);
    return records;
  }

  mention({ item, count, holder, links, source }: ItemMention): void {
    const holdings = this.holdingsFor(item);
    holdings.keepWritten(item);
    const gained = countOf(count);
    const record = this.holdingGaining(holdings, holder, gained, source);
    record.gone = null;
    if (holder !== "") {
      record.holderLinked = true;
      record.links = links;
    }
    holdings.history.push({ kind: "named", count: gained, holder: record.holder, links, source });
  }

  change(change: ItemChange, source: Source): void {
    const changed = this.changedItemOf(change);
    const holdings = this.holdingsFor(changed.item);
    holdings.keepWritten(changed.item);
    const event: ItemEvent = { kind: change.kind, count: countOf(change.count), holder: "", links: findLinks(change.text), source };
    const from = holdings.heldBy(changed.named);
    if (change.kind === "changed") this.changeHands(holdings, from, change, event);
    else this.take(holdings, from, event);
  }

  private changedItemOf(change: ItemChange): ChangedItem {
    const named = change.named;
    if (named !== null && this.byKey.has(keyOf(named.item))) return { item: named.item, named: [named.holder, ...change.namedAfter] };
    return { item: change.item, named: change.namedAfter };
  }

  private take(holdings: ItemHoldings, from: ItemRecord | null, event: ItemEvent): void {
    let record = from;
    if (record === null) record = holdings.first();
    if (record === null) record = holdings.add({ holder: "", holderLinked: false, held: event.count, source: event.source });
    event.holder = record.holder;
    holdings.history.push(event);
    if (from !== null && event.count < from.held) {
      from.held -= event.count;
      return;
    }
    record.gone = event;
  }

  private changeHands(holdings: ItemHoldings, from: ItemRecord | null, change: ItemChange, event: ItemEvent): void {
    const target = targetOf(change);
    event.holder = target;
    holdings.history.push(event);
    if (from === null) {
      this.bringBack(holdings, change, event);
      return;
    }
    if (holderKeyOf(from.holder) === holderKeyOf(target)) return;
    this.move({ holdings, from, change, event });
  }

  private move({ holdings, from, change, event }: Move): void {
    const moved = Math.min(countOf(change.count), from.held);
    const existing = holdings.holdingOf(targetOf(change));
    if (existing === null && moved === from.held) {
      this.takeOver(from, change);
      return;
    }
    from.held -= moved;
    if (from.held === 0) holdings.remove(from);
    this.give(holdings, change, event, moved);
  }

  private holdingGaining(holdings: ItemHoldings, holder: string, gained: number, source: Source): ItemRecord {
    let record = holdings.holdingOf(holder);
    if (record === null) record = this.goneToBringBack(holdings);
    if (record === null) return holdings.add({ holder, holderLinked: holder !== "", held: gained, source });
    if (record.gone === null) {
      record.held += gained;
      return record;
    }
    record.holder = holder;
    record.holderLinked = holder !== "";
    record.held = gained;
    return record;
  }

  private goneToBringBack(holdings: ItemHoldings): ItemRecord | null {
    if (holdings.firstHeld() !== null) return null;
    return holdings.first();
  }

  private bringBack(holdings: ItemHoldings, change: ItemChange, event: ItemEvent): void {
    const gone = holdings.first();
    if (gone === null || holdings.holdingOf(targetOf(change)) !== null) {
      this.give(holdings, change, event, countOf(change.count));
      return;
    }
    gone.gone = null;
    gone.held = countOf(change.count);
    this.takeOver(gone, change);
  }

  private takeOver(record: ItemRecord, change: ItemChange): void {
    record.holder = targetOf(change);
    record.holderLinked = change.holderLinked === true;
    record.links = findLinks(change.text);
  }

  private give(holdings: ItemHoldings, change: ItemChange, event: ItemEvent, count: number): void {
    const holder = targetOf(change);
    let record = holdings.holdingOf(holder);
    if (record === null) record = holdings.add({ holder, holderLinked: change.holderLinked === true, held: count, source: event.source });
    else if (record.gone !== null) record.held = count;
    else record.held += count;
    record.gone = null;
    record.holderLinked = change.holderLinked === true;
    record.links = findLinks(change.text);
  }

  private holdingsFor(item: string): ItemHoldings {
    const key = keyOf(item);
    const found = this.byKey.get(key);
    if (found !== undefined) return found;
    const added = new ItemHoldings(item.trim(), nameOf(item));
    this.byKey.set(key, added);
    return added;
  }
}
