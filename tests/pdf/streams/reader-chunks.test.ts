import { describe, expect, it } from "vitest";
import { present } from "../support/present";
import { ReaderChunks, type ChunkReader } from "../../../src/pdf/streams/inflate/reader-chunks";

class StubReader implements ChunkReader {
  cancelled = 0;
  private readonly results: Iterator<{ done: boolean; value?: Uint8Array }>;

  constructor(results: { done: boolean; value?: Uint8Array }[]) {
    this.results = results.values();
  }

  async read(): Promise<{ done: boolean; value?: Uint8Array }> {
    const step = this.results.next();
    if (step.done === true) return { done: true };
    return step.value;
  }

  async cancel(): Promise<void> {
    this.cancelled += 1;
  }
}

describe("ReaderChunks", () => {
  it("gives each chunk the reader gives", async () => {
    const chunks = new ReaderChunks(new StubReader([{ done: false, value: Uint8Array.from([1, 2]) }]));
    expect([...present(await chunks.next())]).toEqual([1, 2]);
  });

  it("gives null when the reader is done", async () => {
    expect(await new ReaderChunks(new StubReader([{ done: true }])).next()).toBeNull();
  });

  it("gives null when the reader gives no value, even if it says it is not done", async () => {
    expect(await new ReaderChunks(new StubReader([{ done: false }])).next()).toBeNull();
  });

  it("cancels the reader once for each cancel", async () => {
    const reader = new StubReader([]);
    await new ReaderChunks(reader).cancel();
    expect(reader.cancelled).toBe(1);
  });
});
