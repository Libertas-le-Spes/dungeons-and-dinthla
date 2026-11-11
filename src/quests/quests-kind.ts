import type { QuestRecord } from "../campaign/campaign";
import type { ListKind } from "../views/lists/list-page";
import { listQuests } from "./quest-list";
import { addQuestRow } from "./quest-row";
import { questShownKind } from "./quest-shown-kind";

export const questsKind: ListKind<QuestRecord> = {
  ...questShownKind.listWords,
  contentsOf: listQuests,
  addRow: addQuestRow,
};
