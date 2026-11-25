import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

export const EDIT_ALL_WAITING = "Save your Edit all change first, or adding lines loses it.";

export class EditAllReminder {
  private readonly note = new KeptHandle();

  tree(): ViewElement {
    return new Paragraph({ cls: ["dd-edit-all-reminder"], text: EDIT_ALL_WAITING, hidden: true, bindings: [new HandleRequest(this.note)] });
  }

  setShown(shown: boolean): void {
    this.note.setHidden(!shown);
  }
}
