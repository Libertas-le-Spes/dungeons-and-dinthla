import { PdfRefusal } from "../refusals/pdf-refusal";
import type { WorkBudget } from "../work/work-budget";
import { NO_BYTE, byteOf } from "./byte-codes";

export class ByteCursor {
  private readonly view: DataView;
  private readonly size: number;
  private next: number;

  constructor(
    bytes: Uint8Array,
    private readonly work: WorkBudget,
    private readonly origin: number,
  ) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.size = bytes.byteLength;
    this.next = origin;
  }

  position(): number {
    return this.next - this.origin;
  }

  length(): number {
    return this.size - this.origin;
  }

  isAtEnd(): boolean {
    return this.next >= this.size;
  }

  current(): number {
    return this.peek(0);
  }

  peek(ahead: number): number {
    const place = this.next + ahead;
    if (place < this.origin || place >= this.size) return NO_BYTE;
    return this.view.getUint8(place);
  }

  countValue(): void {
    this.work.countValue();
  }

  advance(): void {
    this.work.spend();
    if (this.next < this.size) this.next += 1;
  }

  moveTo(position: number): void {
    const place = this.origin + position;
    if (!Number.isSafeInteger(position) || place < this.origin || place > this.size) {
      throw new PdfRefusal("The file points at a place outside itself, so it was not read.");
    }
    this.next = place;
  }

  startsWith(word: string): boolean {
    for (let index = 0; index < word.length; index += 1) {
      if (this.peek(index) !== byteOf(word.charAt(index))) return false;
    }
    return true;
  }
}
