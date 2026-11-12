import { MAX_RATIO, MAX_STREAM_BYTES, RATIO_CHECKED_ABOVE_BYTES } from "../../limits/pdf-limits";
import { PdfRefusal } from "../../refusals/pdf-refusal";
import type { WorkBudget } from "../../work/work-budget";
import type { DecompressedTotals } from "./decompressed-totals";
import type { InflatedChunks, StartInflating } from "./inflated-chunks";

const TOO_BIG = "A compressed part of the file unpacks to too much, so it was not read.";
const BROKEN = "A compressed part of the file could not be unpacked, so it was not read.";

function isTooBig(unpacked: number, packed: number): boolean {
  if (unpacked > MAX_STREAM_BYTES) return true;
  return unpacked > RATIO_CHECKED_ABOVE_BYTES && unpacked > MAX_RATIO * packed;
}

function joined(parts: Uint8Array[], total: number): Uint8Array {
  const whole = new Uint8Array(total);
  let place = 0;
  for (const part of parts) {
    whole.set(part, place);
    place += part.byteLength;
  }
  return whole;
}

export class BoundedInflater {
  constructor(
    private readonly start: StartInflating,
    private readonly work: WorkBudget,
    private readonly totals: DecompressedTotals,
  ) {}

  async inflate(compressed: Uint8Array): Promise<Uint8Array> {
    const chunks = this.start(compressed);
    const parts: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const chunk = await this.nextChunk(chunks);
      if (chunk === null) break;
      total += chunk.byteLength;
      if (isTooBig(total, compressed.byteLength) || !this.totals.add(chunk.byteLength)) {
        await chunks.cancel();
        throw new PdfRefusal(TOO_BIG);
      }
      this.work.checkTime();
      parts.push(chunk);
    }
    this.work.addInput(total);
    return joined(parts, total);
  }

  private async nextChunk(chunks: InflatedChunks): Promise<Uint8Array | null> {
    try {
      return await chunks.next();
    } catch {
      throw new PdfRefusal(BROKEN);
    }
  }
}
