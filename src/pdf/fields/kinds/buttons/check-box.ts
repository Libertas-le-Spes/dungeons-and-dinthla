import type { PdfValue } from "../../../values/pdf-value";
import type { FieldValue } from "../../field-value";
import type { ButtonKind } from "./button-kind";
import { buttonStateName, OFF } from "./button-state-name";

export class CheckBox implements ButtonKind {
  handles(): boolean {
    return true;
  }

  read(value: PdfValue): FieldValue {
    return buttonStateName(value) !== OFF;
  }
}
