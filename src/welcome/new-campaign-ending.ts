import { Component } from "obsidian";
import { addNameForm } from "./name-form";
import type { WelcomeActions, WelcomeState } from "./welcome-ending";

export const HOW_TO_MAKE_A_CAMPAIGN =
  "A campaign is a folder inside your Campaigns folder holding a note with the same name, such as My Campaign/My Campaign.md. Every note inside the folder belongs to the campaign. Name one here and both are made for you, or make them yourself in Obsidian's file list.";
export const CAMPAIGN_NAME = "Campaign name";
export const MAKE_A_CAMPAIGN = "Make a campaign";

export class NewCampaignEnding extends Component {
  static fits(state: WelcomeState): boolean {
    return state.campaignsFolder !== null && state.campaignFolder === null;
  }

  constructor(
    private readonly endingEl: HTMLElement,
    private readonly actions: WelcomeActions,
  ) {
    super();
  }

  override onload(): void {
    this.endingEl.createEl("p", { cls: "dd-welcome-how", text: HOW_TO_MAKE_A_CAMPAIGN });
    addNameForm(this, this.endingEl, {
      label: CAMPAIGN_NAME,
      buttonText: MAKE_A_CAMPAIGN,
      buttonCls: "mod-cta dd-welcome-go",
      failed: "Couldn't make the campaign",
      make: (name) => this.actions.makeCampaign(name),
    });
  }
}
