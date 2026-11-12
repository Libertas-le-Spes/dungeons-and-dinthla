import { MAX_FIELD_TEXT_CHARACTERS } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";

export function limitedFieldText(text: string): string {
  if (text.length > MAX_FIELD_TEXT_CHARACTERS) throw new PdfRefusal("A field holds more text than the reader allows, so the file was not read.");
  return text;
}
