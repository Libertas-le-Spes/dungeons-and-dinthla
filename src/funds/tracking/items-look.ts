import type { ItemRecord } from "../../campaign/record/campaign";
import { itemKeyOf } from "../../characters/imported/lists/item-key";
import type { FundsLook } from "../../characters/imported/tracking/item-tracking";
import { holderNameOf } from "../items/item-groups";
import { statusOf } from "../items/item-plan";

export const ON_THE_FUNDS_PAGE = "On the funds page";

const GONE_STANDINGS: ReadonlyMap<string, string> = new Map([
  ["sold", "Sold, on the funds page"],
  ["used", "Used up, on the funds page"],
  ["lost", "Lost, on the funds page"],
]);

function standingWordsOf(item: ItemRecord): string {
  const words = GONE_STANDINGS.get(statusOf(item));
  if (words === undefined) return ON_THE_FUNDS_PAGE;
  return words;
}

export class ItemsLook implements FundsLook {
  private readonly importedKeys: Set<string>;

  constructor(
    private readonly items: readonly ItemRecord[],
    private readonly holderName: string,
    written: readonly string[],
  ) {
    this.importedKeys = new Set<string>();
    for (const text of written) this.importedKeys.add(itemKeyOf(text));
  }

  standingOf(written: string): string | null {
    const key = itemKeyOf(written);
    for (const item of this.items) {
      if (itemKeyOf(item.name) === key) return standingWordsOf(item);
    }
    return null;
  }

  heldButNotImported(): readonly string[] {
    const names: string[] = [];
    for (const item of this.items) {
      if (this.isHeldHere(item) && this.importedKeys.has(itemKeyOf(item.name)) === false) names.push(item.name);
    }
    return names;
  }

  private isHeldHere(item: ItemRecord): boolean {
    if (item.gone !== null) return false;
    return holderNameOf(item.holder).toLowerCase() === this.holderName.toLowerCase();
  }
}
