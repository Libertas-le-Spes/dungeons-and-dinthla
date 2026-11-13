import type { Campaign, QuestionRecord, Source } from "../../../campaign/record/campaign";
import { questionTrackedKind } from "../../../kinds/question-tracked-kind";
import type { KindNoteSource } from "./kind-note-source";
import { unmatchedSourcesOf } from "./unmatched-sources";

function sourcesOfQuestion(question: QuestionRecord): Source[] {
  const sources = [question.source];
  for (const clue of question.clues) sources.push(clue.source);
  if (question.answer !== null) sources.push(question.answer.source);
  return sources;
}

export const questionNoteSource: KindNoteSource = {
  kind: questionTrackedKind,
  sourcesOf(campaign: Campaign): Source[] {
    const sources = campaign.questions.flatMap(sourcesOfQuestion);
    return [...sources, ...unmatchedSourcesOf(campaign, questionTrackedKind)];
  },
};
