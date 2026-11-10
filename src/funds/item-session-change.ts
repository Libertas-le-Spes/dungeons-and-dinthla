import type { SessionChange } from "../campaign/session-change";
import type { ItemPlan } from "./item-plan";

export function itemSessionChange(plan: ItemPlan): SessionChange {
  return { removal: plan.removal, rewrite: plan.rewrite, added: { path: plan.targetPath, lines: plan.added }, addedLater: null };
}
