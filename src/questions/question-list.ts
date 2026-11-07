import type { Campaign, QuestionRecord } from "../campaign/campaign";
import { unlink } from "../notes/link";

export interface QuestionList {
  open: QuestionRecord[];
  answered: QuestionRecord[];
  openCount: number;
  answeredCount: number;
}

export function keywordsOf(filter: string): string[] {
  return filter.toLowerCase().split(/\s+/).filter((word) => word !== "");
}

function searchableTextOf(question: QuestionRecord): string {
  const texts = [question.text];
  if (question.answer !== null) texts.push(question.answer.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery(question: QuestionRecord, keywords: string[]): boolean {
  const text = searchableTextOf(question);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listQuestions(campaign: Campaign, keywords: string[]): QuestionList {
  const newestFirst = [...campaign.questions].reverse();
  const open = newestFirst.filter((question) => question.answer === null);
  const answered = newestFirst.filter((question) => question.answer !== null);
  return {
    open: open.filter((question) => matchesEvery(question, keywords)),
    answered: answered.filter((question) => matchesEvery(question, keywords)),
    openCount: open.length,
    answeredCount: answered.length,
  };
}
