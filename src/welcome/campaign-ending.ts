import type { Component } from "obsidian";
import type { WelcomeActions, WelcomeEnding } from "./welcome-ending";

export const GO_TO_CAMPAIGN = "Go to my campaign";

export class CampaignEnding implements WelcomeEnding {
  fits(): boolean {
    return true;
  }

  addTo(endingEl: HTMLElement, actions: WelcomeActions, owner: Component): void {
    const button = endingEl.createEl("button", { cls: "mod-cta dd-welcome-go", text: GO_TO_CAMPAIGN });
    owner.registerDomEvent(button, "click", () => actions.showCampaign());
  }
}
