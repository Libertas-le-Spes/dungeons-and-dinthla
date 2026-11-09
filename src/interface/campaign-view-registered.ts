import type { App } from "obsidian";
import { CAMPAIGN_VIEW } from "./campaign-view";

interface ViewRegistry {
  getViewCreatorByType(type: string): unknown;
}

interface AppWithViews {
  viewRegistry?: ViewRegistry;
}

export function isCampaignViewRegistered(app: App): boolean {
  const registry = (app as unknown as AppWithViews).viewRegistry;
  if (registry === undefined) return false;
  return typeof registry.getViewCreatorByType(CAMPAIGN_VIEW) === "function";
}
