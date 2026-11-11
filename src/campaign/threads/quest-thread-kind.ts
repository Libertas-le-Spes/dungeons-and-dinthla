import { questTrackedKind } from "../../kinds/quest-tracked-kind";
import { readQuest, type QuestStatus } from "../../notes/quest";
import { isQuestLine } from "../../notes/quest-lines";
import type { QuestOutcome, QuestRecord, Source, SourcedText } from "../record/campaign";
import type { ThreadKind } from "./thread-kind";

export const questThreadKind: ThreadKind<QuestRecord, QuestOutcome, QuestStatus> = {
  tracked: questTrackedKind,
  addingName: "progress",
  endingNames: ["completed", "failed"],
  readOpening(body: string, source: Source): QuestRecord | null {
    const quest = readQuest(body);
    if (quest.title === "") return null;
    return { quest, source, progress: [], outcome: null };
  },
  isOpeningLine: isQuestLine,
  textOf(record: QuestRecord): string {
    return record.quest.title;
  },
  additionsOf(record: QuestRecord): SourcedText[] {
    return record.progress;
  },
  endingOf(record: QuestRecord): QuestOutcome | null {
    return record.outcome;
  },
  endingNameOf(outcome: QuestOutcome): QuestStatus {
    return outcome.status;
  },
  end(record: QuestRecord, status: QuestStatus, outcome: SourcedText): void {
    record.outcome = { ...outcome, status };
  },
};
