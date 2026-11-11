import type { SessionChange } from "../../campaign/changes/session-change";
import type { ItemPlan } from "./item-plan";

export function itemSessionChange(plan: ItemPlan): SessionChange {
  if (plan.rewrite !== null) return { rewrite: plan.rewrite };
  return { removal: plan.removal, added: { path: plan.targetPath, lines: plan.added, later: null } };
}
