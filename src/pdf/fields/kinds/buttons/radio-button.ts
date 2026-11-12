import type { PdfValue } from "../../../values/pdf-value";
import type { FieldValue } from "../../field-value";
import type { ButtonKind } from "./button-kind";
import { buttonStateName, OFF } from "./button-state-name";

const RADIO_FLAG = 1 << 15;

export class RadioButton implements ButtonKind {
  handles(flags: number): boolean {
    return (flags & RADIO_FLAG) !== 0;
  }

  read(value: PdfValue): FieldValue | null {
    const name = buttonStateName(value);
    if (name === OFF) return null;
    return name;
  }
}
