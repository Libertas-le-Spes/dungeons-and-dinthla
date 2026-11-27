import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Paragraph, Pre } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

export const CARRYING_TITLE = "Bringing a character along?";
export const CARRYING_PARAGRAPHS: readonly string[] = [
  "If a character from an earlier campaign is joining this one, they can keep their ability scores and other values.",
  "Make a note for them with New character on the Characters page, then add these two properties to it:",
];
export const CARRYING_PROPERTIES = 'carried from: "[[Earlier campaign/Characters/Their name]]"\ncarried: [abilities, values]';
export const CARRYING_CLOSING = "Values learned in this campaign take their place as you play. This message only shows once.";
export const GOT_IT = "Got it";

const DIALOG_CLASSES = ["dd-carrying-notice"];

export class CarryingNoticeDialog implements ShownDialog {
  readonly title = CARRYING_TITLE;
  readonly cls = DIALOG_CLASSES;
  private readonly gotIt = new KeptHandle();
  private view: DialogView | null = null;

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    view.focusOnceOpen(this.gotIt);
  }

  mayClose(): boolean {
    return true;
  }

  closed(): void {}

  private trees(): ViewElement[] {
    const paragraphs = CARRYING_PARAGRAPHS.map((text) => new Paragraph({ text }));
    const properties = new Pre({ cls: ["dd-carrying-properties"], text: CARRYING_PROPERTIES });
    const gotIt = new Button({ cls: ["mod-cta"], text: GOT_IT, bindings: [new PressBinding(new RunAction(this.close.bind(this))), new HandleRequest(this.gotIt)] });
    return [...paragraphs, properties, new Paragraph({ text: CARRYING_CLOSING }), new Div({ cls: ["modal-button-container"] }, [gotIt])];
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }
}
