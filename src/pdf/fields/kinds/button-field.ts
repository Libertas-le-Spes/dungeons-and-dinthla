import type { PdfValue } from "../../values/pdf-value";
import type { FieldValue } from "../field-value";
import { limitedFieldText } from "../field-text";
import type { FieldKind } from "./field-kind";
import { wrongFieldValue } from "./wrong-value";

const RADIO_FLAG = 1 << 15;
const PUSH_BUTTON_FLAG = 1 << 16;
const OFF = "Off";

function hasFlag(flags: number, flag: number): boolean {
  return (flags & flag) !== 0;
}

export class ButtonField implements FieldKind {
  readonly typeName = "Btn";

  read(value: PdfValue, flags: number): FieldValue | null {
    if (hasFlag(flags, PUSH_BUTTON_FLAG)) return null;
    const name = value.asName();
    if (name === null) throw wrongFieldValue();
    if (hasFlag(flags, RADIO_FLAG)) return limitedFieldText(name);
    return name !== OFF;
  }
}
