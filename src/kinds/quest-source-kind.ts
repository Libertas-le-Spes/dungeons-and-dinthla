import type { Source } from "../campaign/campaign";
import type { LookupMatch } from "../lookups/lookup";
import type { LookupOpeners } from "../lookups/open-match";
import type { LookedUpKind } from "./looked-up-kind";

function openQuest(openers: LookupOpeners, _match: LookupMatch, source: Source, onClosed: () => void): void {
  openers.quest(source, onClosed);
}

export const questSourceKind: LookedUpKind = {
  name: "quest",
  marker: { name: "quest", symbol: "!", colourClass: "dd-marker-quest" },
  followUps: [
    { symbol: "!+", kind: "progress" },
    { symbol: "!=", kind: "completed" },
    { symbol: "!x", kind: "failed" },
  ],
  folder: "Quests",
  page: "quests",
  lookupSymbol: "!!",
  lookupWords: { pick: "Pick the quest to update", noMatch: "No active quest matches", none: "No active quests" },
  showsHolder: false,
  open: openQuest,
};
