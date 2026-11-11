import { questionTrackedKind } from "../../kinds/question-tracked-kind";
import { isQuestionLine } from "../../notes/writing/question-lines";
import type { QuestionRecord, Source, SourcedText } from "../record/campaign";
import type { ThreadKind } from "./thread-kind";

export const questionThreadKind: ThreadKind<QuestionRecord, SourcedText, "answer"> = {
  tracked: questionTrackedKind,
  addingName: "clue",
  endingNames: ["answer"],
  readOpening(body: string, source: Source): QuestionRecord | null {
    if (body === "") return null;
    return { text: body, source, clues: [], answer: null };
  },
  isOpeningLine: isQuestionLine,
  textOf(question: QuestionRecord): string {
    return question.text;
  },
  additionsOf(question: QuestionRecord): SourcedText[] {
    return question.clues;
  },
  endingOf(question: QuestionRecord): SourcedText | null {
    return question.answer;
  },
  endingNameOf(): "answer" {
    return "answer";
  },
  end(question: QuestionRecord, _name: "answer", answer: SourcedText): void {
    question.answer = answer;
  },
};
