import type { FollowUpName } from "../kinds/follow-up-name";
import { questTrackedKind } from "../kinds/quest-tracked-kind";
import { readQuest } from "../notes/quest";
import type { QuestRecord, Source, SourcedText } from "./campaign";
import { ThreadBook } from "./thread-book";

export class QuestBook extends ThreadBook<QuestRecord> {
  constructor(unmatched: SourcedText[]) {
    super(questTrackedKind, unmatched);
  }

  protected override opened(body: string, source: Source): QuestRecord | null {
    const { title, ...facts } = readQuest(body);
    if (title === "") return null;
    return { text: title, ...facts, source, notes: [], closing: null };
  }

  protected override attach(quest: QuestRecord, name: FollowUpName, followUp: SourcedText): void {
    if (name === "progress") quest.notes.push(followUp);
    if (name === "completed" || name === "failed") quest.closing = { ...followUp, status: name };
  }
}
