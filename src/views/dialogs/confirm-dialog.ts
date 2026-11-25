import { HandleRequest, PressBinding } from "../elements/bindings/bindings";
import { KeptHandle } from "../elements/bindings/kept-handle";
import { RunAction } from "../elements/bindings/run-action";
import { Button, Div, Paragraph } from "../elements/kinds/containers";
import type { ViewElement } from "../elements/view-element";
import type { DialogView, ShownDialog } from "./dialog-view";

export interface ConfirmText {
  title: string;
  body: string;
  confirm: string;
  keep: string;
}

export type OpenConfirm = (text: ConfirmText, confirmed: () => void, closed: () => void) => void;

const DIALOG_CLASSES = ["dd-confirm"];

export class ConfirmDialog implements ShownDialog {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly keep = new KeptHandle();
  private view: DialogView | null = null;

  constructor(
    private readonly text: ConfirmText,
    private readonly confirmed: () => void,
    private readonly onClosed: () => void,
  ) {
    this.title = text.title;
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    view.focusOnceOpen(this.keep);
  }

  mayClose(): boolean {
    return true;
  }

  closed(): void {
    this.onClosed();
  }

  private trees(): ViewElement[] {
    const confirm = new Button({ cls: ["mod-warning", "dd-confirm-yes"], text: this.text.confirm, bindings: [new PressBinding(new RunAction(this.confirm.bind(this)))] });
    const keep = new Button({ cls: ["dd-confirm-keep"], text: this.text.keep, bindings: [new PressBinding(new RunAction(this.close.bind(this))), new HandleRequest(this.keep)] });
    return [new Paragraph({ cls: ["dd-confirm-body"], text: this.text.body }), new Div({ cls: ["modal-button-container"] }, [confirm, keep])];
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private confirm(): void {
    this.close();
    this.confirmed();
  }
}
