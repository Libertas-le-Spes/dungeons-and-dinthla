import type { QuestionRecord, Source, SourcedText } from "../campaign/campaign";
import { questionShownKind } from "../questions/question-shown-kind";
import type { ThreadPanelActions } from "./thread-panel-actions";
import type { ThreadPanelKind } from "./thread-panel-kind";

export const questionPanelKind: ThreadPanelKind<QuestionRecord, SourcedText, "answer"> = {
  shown: questionShownKind,
  title: "Open questions",
  linkText: "All questions",
  countWord: "open",
  noneText: "Nothing open",
  show(actions: ThreadPanelActions): void {
    actions.showQuestions();
  },
  open(actions: ThreadPanelActions, source: Source, onClosed: (changed: boolean) => void): void {
    actions.openQuestion(source, onClosed);
  },
};
