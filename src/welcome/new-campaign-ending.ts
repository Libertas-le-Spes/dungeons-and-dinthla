import type { Component } from "obsidian";
import type { WelcomeActions, WelcomeEnding, WelcomeState } from "./welcome-ending";

export const HOW_TO_MAKE_A_CAMPAIGN =
  "A campaign is a folder at the top of your vault holding a note with the same name, such as My Campaign/My Campaign.md. Every note inside the folder belongs to the campaign. Name one here and both are made for you, or make them yourself in Obsidian's file list.";
export const CAMPAIGN_NAME = "Campaign name";
export const MAKE_A_CAMPAIGN = "Make a campaign";

export class NewCampaignEnding implements WelcomeEnding {
  fits(state: WelcomeState): boolean {
    return state.campaignFolder === null;
  }

  addTo(endingEl: HTMLElement, actions: WelcomeActions, owner: Component): void {
    endingEl.createEl("p", { cls: "dd-welcome-how", text: HOW_TO_MAKE_A_CAMPAIGN });
    const form = endingEl.createEl("form", { cls: "dd-welcome-make" });
    const name = form.createEl("input", { type: "text", placeholder: CAMPAIGN_NAME, attr: { "aria-label": CAMPAIGN_NAME } });
    const button = form.createEl("button", { cls: "mod-cta dd-welcome-go", type: "submit", text: MAKE_A_CAMPAIGN });
    owner.registerDomEvent(form, "submit", (event) => {
      event.preventDefault();
      void this.make(actions, name.value, button);
    });
  }

  private async make(actions: WelcomeActions, name: string, button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    await actions.makeCampaign(name);
    button.disabled = false;
  }
}
