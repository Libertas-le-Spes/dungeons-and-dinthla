import type { PdfValue } from "../../values/pdf-value";
import type { FieldValue } from "../field-value";
import { limitedFieldText } from "../field-text";
import type { FieldKind } from "./field-kind";
import { wrongFieldValue } from "./wrong-value";

function textOrRefuse(value: PdfValue): string {
  const text = value.asText();
  if (text === null) throw wrongFieldValue();
  return limitedFieldText(text);
}

export class ChoiceField implements FieldKind {
  readonly typeName = "Ch";

  read(value: PdfValue): FieldValue {
    const array = value.asArray();
    if (array === null) return textOrRefuse(value);
    const chosen: string[] = [];
    for (const item of array.items) chosen.push(textOrRefuse(item));
    return chosen;
  }
}
