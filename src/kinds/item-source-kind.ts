import type { Source } from "../campaign/campaign";
import type { LookupMatch } from "../lookups/lookup";
import type { LookupOpeners } from "../lookups/open-match";
import { ledgerMarker } from "./ledger-marker";
import type { LookedUpKind } from "./looked-up-kind";

function openItem(openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void): void {
  openers.item(match.text, source, onClosed);
}

export const itemSourceKind: LookedUpKind = {
  name: "item",
  marker: ledgerMarker,
  followUps: [],
  folder: "Items",
  page: "funds",
  lookupSymbol: "$$",
  lookupWords: { pick: "Pick the item to update", noMatch: "No held item matches", none: "No held items" },
  showsHolder: true,
  open: openItem,
};
