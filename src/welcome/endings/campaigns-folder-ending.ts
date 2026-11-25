import { PressBinding } from "../../views/elements/bindings/bindings";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { NameForm } from "./name-form";
import type { EndingNeeds, EndingPart, WelcomeState } from "./welcome-ending";

export const HOW_TO_CHOOSE_THE_CAMPAIGNS_FOLDER =
  "Choose the folder your campaigns live in, such as D&D.";
export const CHOOSE_A_FOLDER = "Choose a folder";
export const FOLDER_NAME = "Campaigns folder name";
export const MAKE_THE_FOLDER = "Make the folder";

export class CampaignsFolderEnding implements EndingPart {
  static fits(state: WelcomeState): boolean {
    return state.campaignsFolder === null;
  }

  constructor(private readonly needs: EndingNeeds) {}

  trees(): ViewElement[] {
    const form = new NameForm({
      label: FOLDER_NAME,
      buttonText: MAKE_THE_FOLDER,
      buttonCls: ["dd-welcome-go"],
      failed: "Couldn't make the Campaigns folder",
      make: this.make.bind(this),
    }, this.needs.telling);
    return [
      new Paragraph({ cls: ["dd-welcome-how"], text: HOW_TO_CHOOSE_THE_CAMPAIGNS_FOLDER }),
      new Button({ cls: ["mod-cta", "dd-welcome-go"], text: CHOOSE_A_FOLDER, bindings: [new PressBinding(new RunAction(this.pick.bind(this)))] }),
      form.tree(),
    ];
  }

  private pick(): void {
    this.needs.actions.pickCampaignsFolder();
  }

  private make(name: string): Promise<void> {
    return this.needs.actions.makeCampaignsFolder(name);
  }
}
