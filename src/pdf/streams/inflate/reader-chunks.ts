import type { InflatedChunks } from "./inflated-chunks";

export interface ChunkReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
  cancel(): Promise<void>;
}

export class ReaderChunks implements InflatedChunks {
  constructor(private readonly reader: ChunkReader) {}

  async next(): Promise<Uint8Array | null> {
    const result = await this.reader.read();
    if (result.done || result.value === undefined) return null;
    return result.value;
  }

  cancel(): Promise<void> {
    return this.reader.cancel();
  }
}
