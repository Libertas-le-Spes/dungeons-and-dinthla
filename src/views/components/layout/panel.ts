import { Section } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";

const PANEL_CLASS = "dd-panel";

export class Panel {
  constructor(private readonly cls: readonly string[]) {}

  build(children: readonly ViewElement[]): Section {
    return new Section({ cls: [PANEL_CLASS, ...this.cls] }, children);
  }
}
