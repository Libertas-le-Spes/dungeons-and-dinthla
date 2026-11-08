import type { QuestRecord } from "../campaign/campaign";
import type { ListKind } from "../views/list-view";
import { listQuests } from "./quest-list";
import { addQuestRow } from "./quest-row";

export const QUESTS_VIEW = "dungeons-and-dinthla-quests";

export const questsKind: ListKind<QuestRecord> = {
  viewType: QUESTS_VIEW,
  displayText: "Quests",
  icon: "scroll-text",
  className: "dd-quests",
  itemName: "quest",
  openWord: "active",
  foldedWord: "finished",
  foldedTitle: "Finished",
  emptyHint: "No active quests. Start a note with ! to add one.",
  contentsOf: listQuests,
  addRow: addQuestRow,
};
