import { PdfRefusal } from "../refusals/pdf-refusal";

export class ByteSink {
  private readonly collected: number[] = [];

  constructor(
    private readonly capacity: number,
    private readonly tooLong: string,
  ) {}

  push(byte: number): void {
    if (this.collected.length >= this.capacity) throw new PdfRefusal(this.tooLong);
    this.collected.push(byte);
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.collected);
  }
}
