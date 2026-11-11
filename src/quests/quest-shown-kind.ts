import type { Campaign, QuestOutcome, QuestRecord, QuestStatus, Source } from "../campaign/campaign";
import { questThreadKind } from "../campaign/quest-thread-kind";
import { questTrackedKind } from "../kinds/quest-tracked-kind";
import type { LineState } from "../views/lists/line-state";
import type { ShownThreadKind } from "../views/threads/shown-thread-kind";
import type { ThreadFact } from "../views/threads/thread-fact";
import type { EndedLook } from "../views/threads/thread-look";
import type { ThreadOpeners } from "../views/threads/thread-openers";

const MARK_CLASS = "dd-mark-quest";
const COMPLETED: LineState = { sign: "✓", label: "Completed", struck: false };
const ABANDONED: LineState = { sign: "✕", label: "Abandoned", struck: true };
const COMPLETED_LOOK: EndedLook = {
  state: COMPLETED,
  look: {
    markClass: MARK_CLASS,
    sign: COMPLETED.sign,
    label: COMPLETED.label,
    textClass: "dd-text",
    status: { className: "dd-status dd-status-completed", label: COMPLETED.label },
  },
};
const ABANDONED_LOOK: EndedLook = {
  state: ABANDONED,
  look: {
    markClass: "dd-mark-abandoned",
    sign: ABANDONED.sign,
    label: ABANDONED.label,
    textClass: "dd-text dd-abandoned",
    status: { className: "dd-status", label: ABANDONED.label },
  },
};

export const questShownKind: ShownThreadKind<QuestRecord, QuestOutcome, QuestStatus> = {
  threadKind: questThreadKind,
  threadsOf(campaign: Campaign): QuestRecord[] {
    return campaign.quests;
  },
  listWords: { itemName: "quest", openWord: "active", foldedWord: "finished", emptyHint: "No active quests. Start a note with ! to add one." },
  panelWords: { title: "Active quests", link: "All quests", noneOpen: "No active quests" },
  openLook: { markClass: MARK_CLASS, sign: questTrackedKind.marker.symbol, label: null, textClass: "dd-text", status: null },
  endedLookOf(outcome: QuestOutcome): EndedLook {
    if (outcome.status === "completed") return COMPLETED_LOOK;
    return ABANDONED_LOOK;
  },
  factsOf(thread: QuestRecord): ThreadFact[] {
    const facts: ThreadFact[] = [];
    if (thread.quest.givenBy !== undefined) facts.push({ name: "From", value: thread.quest.givenBy });
    if (thread.quest.reward !== undefined) facts.push({ name: "Reward", value: thread.quest.reward });
    return facts;
  },
  show(openers: ThreadOpeners): void {
    openers.showQuests();
  },
  open(openers: ThreadOpeners, source: Source, onClosed: (changed: boolean) => void): void {
    openers.openQuest(source, onClosed);
  },
};
