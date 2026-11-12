import { MAX_ALL_STREAM_BYTES } from "../../limits/pdf-limits";

export class DecompressedTotals {
  private total = 0;

  add(bytes: number): boolean {
    this.total += bytes;
    return this.total <= MAX_ALL_STREAM_BYTES;
  }
}
