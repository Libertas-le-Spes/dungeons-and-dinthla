import { PdfRefusal } from "../refusals/pdf-refusal";

export function unreadableText(): PdfRefusal {
  return new PdfRefusal("A field holds text that is not written the way PDF writes it, so the file was not read.");
}
