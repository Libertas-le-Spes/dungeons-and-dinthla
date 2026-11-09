import { Component, Notice } from "obsidian";
import { messageOf } from "../views/message-of";
import type { WelcomeActions, WelcomeState } from "./welcome-ending";

export const HOW_TO_CHOOSE_THE_CAMPAIGNS_FOLDER =
  "First, choose the folder your campaigns live in, such as D&D. Dungeons & Dinthla reads and writes only inside it and leaves the rest of your vault alone. Pick a folder you already have, or name a new one.";
export const CHOOSE_A_FOLDER = "Choose a folder";
export const FOLDER_NAME = "Campaigns folder name";
export const MAKE_THE_FOLDER = "Make the folder";

export class CampaignsFolderEnding extends Component {
  static fits(state: WelcomeState): boolean {
    return state.campaignsFolder === null;
  }

  constructor(
    private readonly endingEl: HTMLElement,
    private readonly actions: WelcomeActions,
  ) {
    super();
  }

  override onload(): void {
    this.endingEl.createEl("p", { cls: "dd-welcome-how", text: HOW_TO_CHOOSE_THE_CAMPAIGNS_FOLDER });
    const choose = this.endingEl.createEl("button", { cls: "mod-cta dd-welcome-go", text: CHOOSE_A_FOLDER });
    this.registerDomEvent(choose, "click", () => this.actions.pickCampaignsFolder());
    const form = this.endingEl.createEl("form", { cls: "dd-welcome-make" });
    const name = form.createEl("input", { type: "text", placeholder: FOLDER_NAME, attr: { "aria-label": FOLDER_NAME } });
    const button = form.createEl("button", { cls: "dd-welcome-go", type: "submit", text: MAKE_THE_FOLDER });
    this.registerDomEvent(form, "submit", (event) => {
      event.preventDefault();
      this.make(name.value, button).catch((error: unknown) => new Notice(`Couldn't make the Campaigns folder: ${messageOf(error)}`));
    });
  }

  private async make(name: string, button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    try {
      await this.actions.makeCampaignsFolder(name);
    } finally {
      button.disabled = false;
    }
  }
}
