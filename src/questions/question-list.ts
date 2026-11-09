import type { Campaign, QuestionRecord } from "../campaign/campaign";
import { unlink } from "../notes/link";
import type { ListContents } from "../views/list-page";

function searchableTextOf(question: QuestionRecord): string {
  const texts = [question.text];
  if (question.answer !== null) texts.push(question.answer.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery(question: QuestionRecord, keywords: string[]): boolean {
  const text = searchableTextOf(question);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listQuestions(campaign: Campaign, keywords: string[]): ListContents<QuestionRecord> {
  const newestFirst = [...campaign.questions].reverse();
  const open = newestFirst.filter((question) => question.answer === null);
  const answered = newestFirst.filter((question) => question.answer !== null);
  return {
    open: open.filter((question) => matchesEvery(question, keywords)),
    folded: answered.filter((question) => matchesEvery(question, keywords)),
    openCount: open.length,
    foldedCount: answered.length,
  };
}
