import type { PdfValue } from "../../values/pdf-value";
import type { FieldValue } from "../field-value";
import { limitedFieldText } from "../field-text";
import type { FieldKind } from "./field-kind";
import { wrongFieldValue } from "./wrong-value";

export class TextField implements FieldKind {
  readonly typeName = "Tx";

  read(value: PdfValue): FieldValue {
    const text = value.asText();
    if (text === null) throw wrongFieldValue();
    return limitedFieldText(text);
  }
}
