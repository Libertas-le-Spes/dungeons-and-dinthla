import { FieldRow } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";

export class ButtonRow {
  build(buttons: readonly ViewElement[]): FieldRow {
    return new FieldRow("", null, buttons);
  }
}
