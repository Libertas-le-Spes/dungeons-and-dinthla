import { Component } from "obsidian";
import { addNameForm } from "./name-form";
import type { WelcomeActions, WelcomeState } from "./welcome-ending";

export const HOW_TO_CHOOSE_THE_CAMPAIGNS_FOLDER =
  "Choose the folder your campaigns live in, such as D&D.";
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
    addNameForm(this, this.endingEl, {
      label: FOLDER_NAME,
      buttonText: MAKE_THE_FOLDER,
      buttonCls: "dd-welcome-go",
      failed: "Couldn't make the Campaigns folder",
      make: (name) => this.actions.makeCampaignsFolder(name),
    });
  }
}
