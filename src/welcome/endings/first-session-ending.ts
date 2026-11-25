import { PressBinding } from "../../views/elements/bindings/bindings";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { EndingNeeds, EndingPart, WelcomeState } from "./welcome-ending";

export const START_FIRST_SESSION = "Start my first session";

export class FirstSessionEnding implements EndingPart {
  static fits(state: WelcomeState): boolean {
    return state.campaignFolder !== null && state.sessionCount === 0;
  }

  constructor(private readonly needs: EndingNeeds) {}

  trees(): ViewElement[] {
    return [new Button({ cls: ["mod-cta", "dd-welcome-go"], text: START_FIRST_SESSION, bindings: [new PressBinding(new RunAction(this.start.bind(this)))] })];
  }

  private start(): void {
    this.needs.actions.startSession();
  }
}
