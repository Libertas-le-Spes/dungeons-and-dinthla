import type { TFile } from "obsidian";
import type { ItemRecord } from "../../campaign/record/campaign";
import { itemKeyOf, storedItemKeyOf } from "../../characters/imported/lists/item-key";
import { withoutEscapes } from "../../characters/imported/reading/shown-text";
import type { FundsLook, HeldItem } from "../../characters/imported/tracking/item-tracking";
import { holderNameOf } from "../items/item-groups";
import { statusOf } from "../items/item-plan";

export const ON_THE_FUNDS_PAGE = "On the funds page";

const GONE_STANDINGS: ReadonlyMap<string, string> = new Map([
  ["sold", "Sold, on the funds page"],
  ["used", "Used up, on the funds page"],
  ["lost", "Lost, on the funds page"],
]);

export interface HolderPaths {
  pathOf(linkpath: string, sourcePath: string): string | null;
}

export function heldByWords(holderName: string): string {
  return `Held by ${holderName}, on the funds page`;
}

function goneWordsOf(item: ItemRecord): string {
  const words = GONE_STANDINGS.get(statusOf(item));
  if (words === undefined) return ON_THE_FUNDS_PAGE;
  return words;
}

function lastSourcePathOf(item: ItemRecord): string {
  let path = item.source.path;
  for (const event of item.history) path = event.source.path;
  return path;
}

export class ItemsLook implements FundsLook {
  private readonly importedKeys = new Set<string>();

  constructor(
    private readonly items: readonly ItemRecord[],
    private readonly file: TFile,
    written: readonly string[],
    private readonly holders: HolderPaths,
  ) {
    for (const text of written) this.importedKeys.add(itemKeyOf(text));
  }

  standingOf(written: string): string | null {
    const held = this.heldItemWith(itemKeyOf(written));
    if (held !== null) return this.heldWordsOf(held);
    const gone = this.itemWith(itemKeyOf(written));
    if (gone === null) return null;
    return goneWordsOf(gone);
  }

  canTrack(written: string): boolean {
    return this.heldItemWith(itemKeyOf(written)) === null;
  }

  heldButNotImported(): readonly HeldItem[] {
    const held: HeldItem[] = [];
    for (const item of this.items) {
      if (this.isHeldHere(item) && this.importedKeys.has(storedItemKeyOf(item.name)) === false) held.push({ name: item.name, shown: withoutEscapes(item.name) });
    }
    return held;
  }

  private heldWordsOf(item: ItemRecord): string {
    const holderName = holderNameOf(item.holder);
    if (holderName === "" || this.isHeldHere(item)) return ON_THE_FUNDS_PAGE;
    return heldByWords(holderName);
  }

  private heldItemWith(key: string): ItemRecord | null {
    for (const item of this.items) {
      if (item.gone === null && storedItemKeyOf(item.name) === key) return item;
    }
    return null;
  }

  private itemWith(key: string): ItemRecord | null {
    for (const item of this.items) {
      if (storedItemKeyOf(item.name) === key) return item;
    }
    return null;
  }

  private isHeldHere(item: ItemRecord): boolean {
    if (item.gone !== null || item.holderLinked === false) return false;
    return this.holders.pathOf(item.holder, lastSourcePathOf(item)) === this.file.path;
  }
}
