import type { PdfValue } from "../../values/pdf-value";
import type { FieldValue } from "../field-value";
import { BUTTON_KINDS } from "./buttons/button-kinds";
import type { FieldKind } from "./field-kind";
import { wrongFieldValue } from "./wrong-value";

export class ButtonField implements FieldKind {
  readonly typeName = "Btn";

  read(value: PdfValue, flags: number): FieldValue | null {
    for (const kind of BUTTON_KINDS) {
      if (kind.handles(flags)) return kind.read(value);
    }
    throw wrongFieldValue();
  }
}
