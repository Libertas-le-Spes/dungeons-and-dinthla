import type { PdfValue } from "../values/pdf-value";
import type { ObjectLoading, XrefEntry } from "./xref-entry";

export class CompressedEntry implements XrefEntry {
  constructor(
    private readonly container: number,
    private readonly index: number,
  ) {}

  acceptsGeneration(generation: number): boolean {
    return generation === 0;
  }

  containerNumber(): number {
    return this.container;
  }

  load(loading: ObjectLoading, number: number): PdfValue {
    return loading.readCompressed(number, this.container, this.index);
  }
}
