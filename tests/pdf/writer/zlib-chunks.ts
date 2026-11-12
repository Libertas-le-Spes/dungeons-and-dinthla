import { inflateSync } from "node:zlib";
import type { InflatedChunks, StartInflating } from "../../../src/pdf/streams/inflate/inflated-chunks";
import type { ReaderParts } from "../../../src/pdf/reader-parts";

class WholeChunk implements InflatedChunks {
  private given = false;

  constructor(private readonly whole: Uint8Array) {}

  async next(): Promise<Uint8Array | null> {
    if (this.given) return null;
    this.given = true;
    return this.whole;
  }

  async cancel(): Promise<void> {}
}

export const inflateWithZlib: StartInflating = (compressed) => new WholeChunk(inflateSync(compressed));

export function testParts(): ReaderParts {
  return { startInflating: inflateWithZlib, clock: () => 0 };
}
