import type { Component } from "obsidian";
import type { WelcomeActions, WelcomeEnding, WelcomeState } from "./welcome-ending";

export const START_FIRST_SESSION = "Start my first session";

export class FirstSessionEnding implements WelcomeEnding {
  fits(state: WelcomeState): boolean {
    return state.sessionCount === 0;
  }

  addTo(endingEl: HTMLElement, actions: WelcomeActions, owner: Component): void {
    const button = endingEl.createEl("button", { cls: "mod-cta dd-welcome-go", text: START_FIRST_SESSION });
    owner.registerDomEvent(button, "click", () => actions.startSession());
  }
}
