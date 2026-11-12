import { PdfRefusal } from "../../refusals/pdf-refusal";
import type { PdfValue } from "../../values/pdf-value";
import type { XrefEntry } from "./xref-entry";

export class FreeEntry implements XrefEntry {
  acceptsGeneration(): boolean {
    return false;
  }

  containerNumber(): null {
    return null;
  }

  load(): PdfValue {
    throw new PdfRefusal("The file points at an object it says was deleted, so it was not read.");
  }
}
