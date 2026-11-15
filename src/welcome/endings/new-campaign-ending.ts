import { Component } from "obsidian";
import { addNameForm } from "./name-form";
import type { WelcomeActions, WelcomeState } from "./welcome-ending";

export const HOW_TO_MAKE_A_CAMPAIGN =
  "A campaign is a folder with a main note of the same name. Name one here to make both.";
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
