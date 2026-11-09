import type { QuestRecord } from "../campaign/campaign";
import type { ListKind } from "../views/list-view";
import { listQuests } from "./quest-list";
import { addQuestRow } from "./quest-row";

export const questsKind: ListKind<QuestRecord> = {
  displayText: "Quests",
  icon: "scroll-text",
  itemName: "quest",
  openWord: "active",
  foldedWord: "finished",
  emptyHint: "No active quests. Start a note with ! to add one.",
  contentsOf: listQuests,
  addRow: addQuestRow,
};
