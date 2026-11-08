import type { QuestRecord } from "../campaign/campaign";
import type { ListKind } from "../views/list-view";
import { listQuests } from "./quest-list";
import { addQuestRow } from "./quest-row";

export const QUESTS_VIEW = "dungeons-and-dinthla-quests";

export const questsKind: ListKind<QuestRecord> = {
  viewType: QUESTS_VIEW,
  displayText: "Quests",
  icon: "scroll-text",
  itemName: "quest",
  openWord: "active",
  foldedWord: "finished",
  emptyHint: "No active quests. Start a note with ! to add one.",
  createLabel: "New quest",
  contentsOf: listQuests,
  addRow: addQuestRow,
};
