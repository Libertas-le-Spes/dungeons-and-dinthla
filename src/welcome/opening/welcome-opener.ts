import type { App } from "obsidian";
import { openCampaignPage } from "../../interface/open-campaign";
import type { ShowWelcome } from "./first-run";

export function welcomeOpenerOf(app: App): ShowWelcome {
  return () => openCampaignPage(app, "welcome", null);
}
