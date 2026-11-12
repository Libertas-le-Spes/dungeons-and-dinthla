import type { PdfValue } from "../values/pdf-value";
import type { ObjectLoading, XrefEntry } from "./xref-entry";

export class InFileEntry implements XrefEntry {
  constructor(
    private readonly offset: number,
    private readonly generation: number,
  ) {}

  acceptsGeneration(generation: number): boolean {
    return generation === this.generation;
  }

  containerNumber(): null {
    return null;
  }

  load(loading: ObjectLoading, number: number): PdfValue {
    return loading.readInFile(number, this.generation, this.offset);
  }
}
