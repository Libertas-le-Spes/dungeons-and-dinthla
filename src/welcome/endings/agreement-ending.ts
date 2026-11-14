import { Component } from "obsidian";
import type { AgreementShower, WelcomeActions, WelcomeState } from "./welcome-ending";

export const BRINGING_YOUR_CHARACTER_IN = "Bringing your character in";

export class AgreementEnding extends Component {
  static fits(state: WelcomeState): boolean {
    return state.campaignFolder !== null && state.agreementWanted;
  }

  constructor(
    private readonly endingEl: HTMLElement,
    _actions: WelcomeActions,
    private readonly agreement: AgreementShower,
  ) {
    super();
  }

  override onload(): void {
    this.endingEl.createEl("h3", { cls: "dd-welcome-step", text: BRINGING_YOUR_CHARACTER_IN });
    this.agreement.showAgreement(this.endingEl);
  }
}
