import { Component, Notice } from "obsidian";
import { messageOf } from "../views/message-of";
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
    const form = this.endingEl.createEl("form", { cls: "dd-welcome-make" });
    const name = form.createEl("input", { type: "text", placeholder: CAMPAIGN_NAME, attr: { "aria-label": CAMPAIGN_NAME } });
    const button = form.createEl("button", { cls: "mod-cta dd-welcome-go", type: "submit", text: MAKE_A_CAMPAIGN });
    this.registerDomEvent(form, "submit", (event) => {
      event.preventDefault();
      this.make(name.value, button).catch((error: unknown) => new Notice(`Couldn't make the campaign: ${messageOf(error)}`));
    });
  }

  private async make(name: string, button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    try {
      await this.actions.makeCampaign(name);
    } finally {
      button.disabled = false;
    }
  }
}
