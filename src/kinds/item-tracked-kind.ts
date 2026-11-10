import { ledgerMarker } from "./ledger-marker";
import type { LookedUpKind } from "./looked-up-kind";
import type { LookupFinders } from "./lookup-finders";
import type { LookupOpeners } from "./lookup-openers";
import type { Source } from "./source";

function openItem(openers: LookupOpeners, text: string, source: Source, onClosed: () => void): void {
  openers.item(text, source, onClosed);
}

function findItems<Match>(finders: LookupFinders<Match>, keywords: string[]): Match[] {
  return finders.item(keywords);
}

export const itemTrackedKind = {
  name: "item",
  marker: ledgerMarker,
  followUps: {},
  folder: "Items",
  page: "funds",
  lookup: {
    symbol: "$$",
    words: { pick: "Pick the item to update", noMatch: "No held item matches", none: "No held items" },
    showsHolder: true,
    open: openItem,
    find: findItems,
  },
} satisfies LookedUpKind;
