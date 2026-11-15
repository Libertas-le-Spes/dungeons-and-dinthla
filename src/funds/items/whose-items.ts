import { holderNameOf, type ItemSummary } from "./item-groups";

export interface WhoseItemsParts {
  summary: ItemSummary;
  ownNames: readonly string[];
}

export interface WhoseItems {
  mine: ItemSummary;
  party: ItemSummary;
}

function summaryOf(summary: ItemSummary, isShown: (holder: string) => boolean): ItemSummary {
  const groups = summary.groups.filter((group) => isShown(group.holder));
  const gone = summary.gone.filter((item) => isShown(holderNameOf(item.holder)));
  const heldCount = groups.reduce((count, group) => count + group.items.length, 0);
  return { groups, gone, heldCount };
}

export function whoseItems({ summary, ownNames }: WhoseItemsParts): WhoseItems {
  const own = new Set(ownNames.map((name) => name.toLowerCase()));
  const isMine = (holder: string): boolean => own.has(holder.toLowerCase());
  return {
    mine: summaryOf(summary, isMine),
    party: summaryOf(summary, (holder) => !isMine(holder)),
  };
}
