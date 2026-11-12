import { PdfRefusal } from "../../refusals/pdf-refusal";

export function wrongFieldValue(): PdfRefusal {
  return new PdfRefusal("A field holds a value of a kind the reader does not read, so the file was not read.");
}
