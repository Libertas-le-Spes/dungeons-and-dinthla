import { Component } from "obsidian";
import type { WelcomeActions, WelcomeState } from "./welcome-ending";

export const START_FIRST_SESSION = "Start my first session";

export class FirstSessionEnding extends Component {
  static fits(state: WelcomeState): boolean {
    return state.campaignFolder !== null && state.sessionCount === 0;
  }

  constructor(
    private readonly endingEl: HTMLElement,
    private readonly actions: WelcomeActions,
  ) {
    super();
  }

  override onload(): void {
    const button = this.endingEl.createEl("button", { cls: "mod-cta dd-welcome-go", text: START_FIRST_SESSION });
    this.registerDomEvent(button, "click", () => this.actions.startSession());
  }
}
