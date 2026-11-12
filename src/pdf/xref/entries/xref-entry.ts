import type { PdfValue } from "../../values/pdf-value";

export interface ObjectLoading {
  readInFile(number: number, generation: number, offset: number): PdfValue;
  readCompressed(number: number, containerNumber: number, index: number): PdfValue;
}

export interface XrefEntry {
  acceptsGeneration(generation: number): boolean;
  containerNumber(): number | null;
  load(loading: ObjectLoading, number: number): PdfValue;
}
