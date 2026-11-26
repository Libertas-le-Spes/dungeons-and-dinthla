import type { App } from "obsidian";
import { openCampaignPage } from "../interface/tabs/open-campaign";
import type { ShowWelcome } from "../../welcome/opening/first-run";

export function welcomeOpenerOf(app: App): ShowWelcome {
  return () => openCampaignPage(app, "welcome", null);
}
