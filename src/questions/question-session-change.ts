import type { SessionChange } from "../campaign/session-change";
import type { QuestionPlan } from "./question-plan";

export const FOLLOW_UP_NOT_WRITTEN = "The answer was written, but the follow-up couldn't be:";

export function questionSessionChange(plan: QuestionPlan): SessionChange {
  if (plan.answerPath === plan.followUpPath) {
    return { removal: plan.removal, added: { path: plan.answerPath, lines: [...plan.answerLines, ...plan.followUpLines], later: null } };
  }
  const later = { path: plan.followUpPath, lines: plan.followUpLines, partlyWritten: FOLLOW_UP_NOT_WRITTEN };
  return { removal: plan.removal, added: { path: plan.answerPath, lines: plan.answerLines, later } };
}
