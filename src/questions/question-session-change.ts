import type { SessionChange } from "../campaign/session-change";
import type { QuestionPlan } from "./question-plan";

export const FOLLOW_UP_NOT_WRITTEN = "The answer was written, but the follow-up couldn't be:";

export function questionSessionChange(plan: QuestionPlan): SessionChange {
  if (plan.answerPath === plan.followUpPath) {
    const added = { path: plan.answerPath, lines: [...plan.answerLines, ...plan.followUpLines] };
    return { removal: plan.removal, rewrite: null, added, addedLater: null };
  }
  const added = { path: plan.answerPath, lines: plan.answerLines };
  const addedLater = { path: plan.followUpPath, lines: plan.followUpLines, partlyWritten: FOLLOW_UP_NOT_WRITTEN };
  return { removal: plan.removal, rewrite: null, added, addedLater };
}
