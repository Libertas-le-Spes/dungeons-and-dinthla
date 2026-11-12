import type { LookedUpKind } from "./looked-up-kind";
import type { LookupOpeners } from "./lookup-openers";
import type { Source } from "./source";

function openQuest(openers: LookupOpeners, _text: string, source: Source, onClosed: () => void): void {
  openers.quest(source, onClosed);
}

export const questTrackedKind = {
  name: "quest",
  marker: { name: "quest", symbol: "!", colourClass: "dd-marker-quest" },
  followUps: { progress: "!+", completed: "!=", failed: "!x" },
  folder: "Quests",
  kindNoteFolder: "Quests",
  page: "quests",
  lookup: {
    symbol: "!!",
    words: { pick: "Pick the quest to update", noMatch: "No active quest matches", none: "No active quests" },
    showsHolder: false,
    open: openQuest,
  },
} satisfies LookedUpKind;
