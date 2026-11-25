import { Heading3 } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { EndingNeeds, EndingPart, WelcomeState } from "./welcome-ending";

export const BRINGING_YOUR_CHARACTER_IN = "Bringing your character in";

export class AgreementEnding implements EndingPart {
  static fits(state: WelcomeState): boolean {
    return state.campaignFolder !== null && state.agreementWanted;
  }

  constructor(private readonly needs: EndingNeeds) {}

  trees(): ViewElement[] {
    return [new Heading3({ cls: ["dd-welcome-step"], text: BRINGING_YOUR_CHARACTER_IN }), ...this.needs.agreement.trees(this.needs.answered.bind(this.needs))];
  }
}
