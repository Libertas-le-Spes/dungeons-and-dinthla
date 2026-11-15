import type { Campaign, QuestionRecord, Source, SourcedText } from "../../campaign/record/campaign";
import { questionThreadKind } from "../../campaign/threads/question-thread-kind";
import { questionTrackedKind } from "../../kinds/question-tracked-kind";
import type { LineState } from "../../views/threads/line-state";
import type { ShownThreadKind } from "../../views/threads/shown-thread-kind";
import type { ThreadFact } from "../../views/threads/thread-fact";
import type { EndedLook } from "../../views/threads/thread-look";
import type { ThreadOpeners, ThreadRowOpeners } from "../../views/threads/thread-openers";

const MARK_CLASS = "dd-mark-question";
const ANSWERED: LineState = { sign: "✓", label: "Answered", struck: false };
const ANSWERED_LOOK: EndedLook = {
  state: ANSWERED,
  look: { markClass: MARK_CLASS, sign: ANSWERED.sign, label: ANSWERED.label, textClass: "dd-text", status: null },
};

export const questionShownKind: ShownThreadKind<QuestionRecord, SourcedText, "answer"> = {
  threadKind: questionThreadKind,
  threadsOf(campaign: Campaign): QuestionRecord[] {
    return campaign.questions;
  },
  listWords: { itemName: "question", openWord: "open", foldedWord: "answered", emptyHint: "No open questions. Start a note with ? to ask one." },
  panelWords: { title: "Open questions", link: "All questions", noneOpen: "Nothing open" },
  openLook: { markClass: MARK_CLASS, sign: questionTrackedKind.marker.symbol, label: null, textClass: "dd-text", status: null },
  endedLookOf(): EndedLook {
    return ANSWERED_LOOK;
  },
  factsOf(): ThreadFact[] {
    return [];
  },
  show(openers: ThreadOpeners): void {
    openers.showQuestions();
  },
  open(openers: ThreadRowOpeners, source: Source, onClosed: (changed: boolean) => void): void {
    openers.openQuestion(source, onClosed);
  },
};
