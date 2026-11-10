import type { QuestOutcome, QuestRecord, QuestStatus, Source } from "../campaign/campaign";
import { questShownKind } from "../quests/quest-shown-kind";
import type { ThreadPanelActions } from "./thread-panel-actions";
import type { ThreadPanelKind } from "./thread-panel-kind";

export const questPanelKind: ThreadPanelKind<QuestRecord, QuestOutcome, QuestStatus> = {
  shown: questShownKind,
  title: "Active quests",
  linkText: "All quests",
  countWord: "active",
  noneText: "No active quests",
  show(actions: ThreadPanelActions): void {
    actions.showQuests();
  },
  open(actions: ThreadPanelActions, source: Source, onClosed: (changed: boolean) => void): void {
    actions.openQuest(source, onClosed);
  },
};
