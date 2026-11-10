import type { FollowUpName } from "../kinds/follow-up-name";
import { questionTrackedKind } from "../kinds/question-tracked-kind";
import type { QuestionRecord, Source, SourcedText } from "./campaign";
import { ThreadBook } from "./thread-book";

export class QuestionBook extends ThreadBook<QuestionRecord> {
  constructor(unmatched: SourcedText[]) {
    super(questionTrackedKind, unmatched);
  }

  protected override opened(body: string, source: Source): QuestionRecord | null {
    if (body === "") return null;
    return { text: body, source, notes: [], closing: null };
  }

  protected override attach(question: QuestionRecord, name: FollowUpName, followUp: SourcedText): void {
    if (name === "answer") question.closing = followUp;
    if (name === "clue") question.notes.push(followUp);
  }
}
