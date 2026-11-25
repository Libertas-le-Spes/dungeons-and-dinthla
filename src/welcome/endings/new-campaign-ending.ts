import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { NameForm } from "./name-form";
import type { EndingNeeds, EndingPart, WelcomeState } from "./welcome-ending";

export const HOW_TO_MAKE_A_CAMPAIGN =
  "A campaign is a folder with a main note of the same name. Name one here to make both.";
export const CAMPAIGN_NAME = "Campaign name";
export const MAKE_A_CAMPAIGN = "Make a campaign";

export class NewCampaignEnding implements EndingPart {
  static fits(state: WelcomeState): boolean {
    return state.campaignsFolder !== null && state.campaignFolder === null;
  }

  constructor(private readonly needs: EndingNeeds) {}

  trees(): ViewElement[] {
    const form = new NameForm({
      label: CAMPAIGN_NAME,
      buttonText: MAKE_A_CAMPAIGN,
      buttonCls: ["mod-cta", "dd-welcome-go"],
      failed: "Couldn't make the campaign",
      make: this.make.bind(this),
    }, this.needs.telling);
    return [new Paragraph({ cls: ["dd-welcome-how"], text: HOW_TO_MAKE_A_CAMPAIGN }), form.tree()];
  }

  private make(name: string): Promise<void> {
    return this.needs.actions.makeCampaign(name);
  }
}
