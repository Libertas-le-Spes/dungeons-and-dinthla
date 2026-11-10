import type { QuestRecord } from "../campaign/campaign";
import type { LinkActions } from "../views/linked-text";
import { addThreadRow } from "../views/thread-row";
import { questShownKind } from "./quest-shown-kind";

export function addQuestRow(list: HTMLElement, record: QuestRecord, keywords: string[], actions: LinkActions): void {
  addThreadRow(questShownKind, list, record, keywords, actions);
}
