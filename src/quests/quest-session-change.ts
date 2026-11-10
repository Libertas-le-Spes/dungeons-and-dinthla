import type { SessionChange } from "../campaign/session-change";
import type { QuestPlan } from "./quest-plan";

export function questSessionChange(plan: QuestPlan): SessionChange {
  return { removal: plan.removal, rewrite: null, added: { path: plan.targetPath, lines: plan.added }, addedLater: null };
}
