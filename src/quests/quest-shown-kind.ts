import type { Campaign, QuestOutcome, QuestRecord, QuestStatus } from "../campaign/campaign";
import { questThreadKind } from "../campaign/quest-thread-kind";
import type { LineState } from "../views/line-state";
import type { ShownThreadKind, ThreadFact } from "../views/shown-thread-kind";

const COMPLETED: LineState = { sign: "✓", label: "Completed", struck: false };
const ABANDONED: LineState = { sign: "✕", label: "Abandoned", struck: true };

export const questShownKind: ShownThreadKind<QuestRecord, QuestOutcome, QuestStatus> = {
  kind: questThreadKind,
  threadsOf(campaign: Campaign): QuestRecord[] {
    return campaign.quests;
  },
  markClass: "dd-mark-quest",
  factsOf(record: QuestRecord): ThreadFact[] {
    const facts: ThreadFact[] = [];
    if (record.quest.givenBy !== undefined) facts.push({ name: "From", value: record.quest.givenBy });
    if (record.quest.reward !== undefined) facts.push({ name: "Reward", value: record.quest.reward });
    return facts;
  },
  stateOf(outcome: QuestOutcome): LineState {
    if (outcome.status === "completed") return COMPLETED;
    return ABANDONED;
  },
  showsStateInMeta: true,
};
