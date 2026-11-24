import { PressBinding } from "../../elements/bindings/bindings";
import type { PageAction } from "../../elements/bindings/page-action";
import { Button } from "../../elements/kinds/containers";

const MAIN_CLASS = "mod-cta";

export class MainButton {
  constructor(
    private readonly text: string,
    private readonly action: PageAction,
  ) {}

  build(): Button {
    return new Button({ cls: [MAIN_CLASS], text: this.text, bindings: [new PressBinding(this.action)] });
  }
}

export class PlainButton {
  constructor(
    private readonly text: string,
    private readonly action: PageAction,
  ) {}

  build(): Button {
    return new Button({ text: this.text, bindings: [new PressBinding(this.action)] });
  }
}
