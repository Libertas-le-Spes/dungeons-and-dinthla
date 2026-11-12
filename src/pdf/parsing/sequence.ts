import { PdfRefusal } from "../refusals/pdf-refusal";

export class Sequence {
  private readonly iterator: Iterator<number>;
  private left: number;

  constructor(numbers: readonly number[]) {
    this.iterator = numbers.values();
    this.left = numbers.length;
  }

  remaining(): number {
    return this.left;
  }

  next(): number {
    const step = this.iterator.next();
    if (step.done === true) throw new PdfRefusal("A list in the file has fewer numbers than it should, so the file was not read.");
    this.left -= 1;
    return step.value;
  }
}
