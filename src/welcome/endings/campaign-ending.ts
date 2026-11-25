import { PressBinding } from "../../views/elements/bindings/bindings";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { EndingNeeds, EndingPart, WelcomeState } from "./welcome-ending";

export const GO_TO_CAMPAIGN = "Go to my campaign";

export class CampaignEnding implements EndingPart {
  static fits(state: WelcomeState): boolean {
    return state.campaignFolder !== null && state.sessionCount > 0;
  }

  constructor(private readonly needs: EndingNeeds) {}

  trees(): ViewElement[] {
    return [new Button({ cls: ["mod-cta", "dd-welcome-go"], text: GO_TO_CAMPAIGN, bindings: [new PressBinding(new RunAction(this.go.bind(this)))] })];
  }

  private go(): void {
    this.needs.actions.showCampaign();
  }
}
