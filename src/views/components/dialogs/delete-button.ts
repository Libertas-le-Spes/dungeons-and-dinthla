import { HandleRequest, PressBinding } from "../../elements/bindings/bindings";
import { KeptHandle } from "../../elements/bindings/kept-handle";
import { HERE, type OpenPlace } from "../../elements/bindings/open-place";
import type { PageAction } from "../../elements/bindings/page-action";
import { Button } from "../../elements/kinds/containers";
import { PRESS_AGAIN, SecondPress } from "../../dialogs/second-press";

const DELETE_CLASSES = ["mod-warning", "dd-delete"];

export class DeleteButton implements PageAction {
  private readonly kept = new KeptHandle();
  private readonly secondPress: SecondPress;

  constructor(
    private readonly label: string,
    private readonly confirmed: PageAction,
  ) {
    this.secondPress = new SecondPress(this.showArmed.bind(this), this.confirm.bind(this));
  }

  build(): Button {
    return new Button({ cls: DELETE_CLASSES, text: this.label, bindings: [new PressBinding(this), new HandleRequest(this.kept)] });
  }

  run(_place: OpenPlace): void {
    this.secondPress.press();
  }

  stop(): void {
    this.secondPress.stop();
  }

  private confirm(): void {
    this.confirmed.run(HERE);
  }

  private showArmed(armed: boolean): void {
    if (armed) this.kept.setText(PRESS_AGAIN);
    else this.kept.setText(this.label);
  }
}
