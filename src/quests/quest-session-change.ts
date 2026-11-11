import type { SessionChange } from "../campaign/session-change";
import type { QuestPlan } from "./quest-plan";

export function questSessionChange(plan: QuestPlan): SessionChange {
  return { removal: plan.removal, added: { path: plan.targetPath, lines: plan.added, later: null } };
}
