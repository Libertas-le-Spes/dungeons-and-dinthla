import type { Campaign, QuestionRecord, SourcedText } from "../campaign/campaign";
import { questionThreadKind } from "../campaign/question-thread-kind";
import type { LineState } from "../views/line-state";
import type { ShownThreadKind, ThreadFact } from "../views/shown-thread-kind";

const ANSWERED: LineState = { sign: "✓", label: "Answered", struck: false };

export const questionShownKind: ShownThreadKind<QuestionRecord, SourcedText, "answer"> = {
  kind: questionThreadKind,
  threadsOf(campaign: Campaign): QuestionRecord[] {
    return campaign.questions;
  },
  markClass: "dd-mark-question",
  factsOf(): ThreadFact[] {
    return [];
  },
  stateOf(): LineState {
    return ANSWERED;
  },
  showsStateInMeta: false,
};
