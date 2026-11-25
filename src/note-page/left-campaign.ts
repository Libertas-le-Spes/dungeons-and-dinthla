import { HandleRequest, PressBinding } from "../views/elements/bindings/bindings";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import { RunAction } from "../views/elements/bindings/run-action";
import { Button, Div, Paragraph } from "../views/elements/kinds/containers";
import type { ViewElement } from "../views/elements/view-element";

export const LEFT_CAMPAIGN =
  "This note was moved out of the campaign, so it opens in Obsidian's editor from now on. Save what you typed here first.";
export const OPEN_IN_EDITOR = "Open in Obsidian's editor";

export class LeftCampaign {
  private readonly button = new KeptHandle();

  constructor(private readonly open: () => void) {}

  tree(): ViewElement {
    const pressed = new RunAction(this.pressed.bind(this));
    return new Div({ cls: ["dd-left-campaign"] }, [
      new Paragraph({ cls: ["dd-left-campaign-message"], text: LEFT_CAMPAIGN }),
      new Button({ cls: ["mod-cta", "dd-open-in-editor"], text: OPEN_IN_EDITOR, bindings: [new PressBinding(pressed), new HandleRequest(this.button)] }),
    ]);
  }

  setUnsaved(unsaved: boolean): void {
    this.button.setDisabled(unsaved);
  }

  private pressed(): void {
    this.open();
  }
}
