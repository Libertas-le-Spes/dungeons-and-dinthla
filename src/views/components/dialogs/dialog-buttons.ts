import { HandleRequest, PressBinding } from "../../elements/bindings/bindings";
import type { HandleWanted } from "../../elements/bindings/binding-wiring";
import type { ElementBinding } from "../../elements/bindings/element-binding";
import type { PageAction } from "../../elements/bindings/page-action";
import { Button } from "../../elements/kinds/containers";

const MAIN_CLASS = "mod-cta";

export class MainButton {
  constructor(
    private readonly text: string,
    private readonly action: PageAction,
  ) {}

  build(handle: HandleWanted | null = null): Button {
    const bindings: ElementBinding[] = [new PressBinding(this.action)];
    if (handle !== null) bindings.push(new HandleRequest(handle));
    return new Button({ cls: [MAIN_CLASS], text: this.text, bindings });
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
