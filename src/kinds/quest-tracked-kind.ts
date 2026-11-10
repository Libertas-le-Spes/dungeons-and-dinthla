import type { LookedUpKind } from "./looked-up-kind";
import type { LookupFinders } from "./lookup-finders";
import type { LookupOpeners } from "./lookup-openers";
import type { Source } from "./source";

function openQuest(openers: LookupOpeners, _text: string, source: Source, onClosed: () => void): void {
  openers.quest(source, onClosed);
}

function findQuests<Match>(finders: LookupFinders<Match>, keywords: string[]): Match[] {
  return finders.quest(keywords);
}

export const questTrackedKind = {
  name: "quest",
  marker: { name: "quest", symbol: "!", colourClass: "dd-marker-quest" },
  followUps: { progress: "!+", completed: "!=", failed: "!x" },
  folder: "Quests",
  page: "quests",
  lookup: {
    symbol: "!!",
    words: { pick: "Pick the quest to update", noMatch: "No active quest matches", none: "No active quests" },
    showsHolder: false,
    open: openQuest,
    find: findQuests,
  },
} satisfies LookedUpKind;
