import { HandleRequest, PressBinding } from "../../elements/bindings/bindings";
import { KeptHandle } from "../../elements/bindings/kept-handle";
import { RunAction } from "../../elements/bindings/run-action";
import { Button } from "../../elements/kinds/containers";

export interface ButtonAction {
  run(returnFocus: () => void): void;
}

export class ActionButton {
  private readonly kept = new KeptHandle();

  constructor(
    private readonly label: string,
    private readonly classes: readonly string[],
    private readonly action: ButtonAction,
  ) {}

  build(): Button {
    const pressed = new RunAction(this.press.bind(this));
    return new Button({ cls: this.classes, text: this.label, bindings: [new PressBinding(pressed), new HandleRequest(this.kept)] });
  }

  private press(): void {
    this.action.run(this.kept.focus.bind(this.kept));
  }
}
