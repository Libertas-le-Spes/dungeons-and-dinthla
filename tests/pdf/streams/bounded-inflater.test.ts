import { describe, expect, it } from "vitest";
import { MAX_ALL_STREAM_BYTES, MAX_RATIO, MAX_STREAM_BYTES, RATIO_CHECKED_ABOVE_BYTES, WORK_EXTRA, WORK_PER_BYTE } from "../../../src/pdf/limits/pdf-limits";
import { BoundedInflater } from "../../../src/pdf/streams/inflate/bounded-inflater";
import { DecompressedTotals } from "../../../src/pdf/streams/inflate/decompressed-totals";
import type { InflatedChunks } from "../../../src/pdf/streams/inflate/inflated-chunks";
import { WorkBudget } from "../../../src/pdf/work/work-budget";
import { refusalFromAsync } from "../support/parsed";

class StubChunks implements InflatedChunks {
  reads = 0;
  cancels = 0;
  private readonly sizes: Iterator<number>;

  constructor(
    sizes: number[],
    private readonly failAt: number = -1,
  ) {
    this.sizes = sizes.values();
  }

  async next(): Promise<Uint8Array | null> {
    this.reads += 1;
    if (this.reads - 1 === this.failAt) throw new Error("the platform failed");
    const step = this.sizes.next();
    if (step.done === true) return null;
    return new Uint8Array(step.value);
  }

  async cancel(): Promise<void> {
    this.cancels += 1;
  }
}

function inflaterOver(chunks: InflatedChunks, totals = new DecompressedTotals(), work = new WorkBudget(1000, () => 0)): BoundedInflater {
  return new BoundedInflater(() => chunks, work, totals);
}

describe("BoundedInflater", () => {
  it("joins the chunks in order", async () => {
    const result = await inflaterOver(new StubChunks([2, 3])).inflate(new Uint8Array(10));
    expect(result.byteLength).toBe(5);
  });

  it("gives an empty result for no chunks", async () => {
    expect((await inflaterOver(new StubChunks([])).inflate(new Uint8Array(1))).byteLength).toBe(0);
  });

  it("accepts a stream of exactly the most bytes allowed, in one chunk, and never cancels", async () => {
    const chunks = new StubChunks([MAX_STREAM_BYTES]);
    const result = await inflaterOver(chunks).inflate(new Uint8Array(MAX_STREAM_BYTES));
    expect(result.byteLength).toBe(MAX_STREAM_BYTES);
    expect(chunks.cancels).toBe(0);
  });

  it("refuses a stream one byte over, cancels once, and reads nothing after", async () => {
    const chunks = new StubChunks([MAX_STREAM_BYTES, 1, 5, 5]);
    const reason = await refusalFromAsync(() => inflaterOver(chunks).inflate(new Uint8Array(MAX_STREAM_BYTES)));
    expect(reason).toContain("unpacks to too much");
    expect(chunks.cancels).toBe(1);
    expect(chunks.reads).toBe(2);
  });

  it("counts chunk by chunk, so many small chunks add up to the same limit", async () => {
    const sizes = new Array<number>(MAX_STREAM_BYTES / 1024 + 1).fill(1024);
    const chunks = new StubChunks(sizes);
    const reason = await refusalFromAsync(() => inflaterOver(chunks).inflate(new Uint8Array(MAX_STREAM_BYTES)));
    expect(reason).toContain("unpacks to too much");
    expect(chunks.reads).toBe(MAX_STREAM_BYTES / 1024 + 1);
    expect(chunks.cancels).toBe(1);
  });

  it("stops at the first chunk that passes the limit, not at the end of the stream", async () => {
    const chunks = new StubChunks([MAX_STREAM_BYTES - 5, 10, 10, 10, 10]);
    await refusalFromAsync(() => inflaterOver(chunks).inflate(new Uint8Array(MAX_STREAM_BYTES)));
    expect(chunks.reads).toBe(2);
  });

  it("accepts a ratio of exactly the most allowed, once over the size the ratio is checked above", async () => {
    const packed = new Uint8Array(Math.ceil((RATIO_CHECKED_ABOVE_BYTES + 1) / MAX_RATIO));
    const size = MAX_RATIO * packed.byteLength;
    const result = await inflaterOver(new StubChunks([size])).inflate(packed);
    expect(result.byteLength).toBe(size);
  });

  it("refuses a ratio just over the most allowed", async () => {
    const size = RATIO_CHECKED_ABOVE_BYTES + 1;
    const packed = new Uint8Array(Math.floor(size / MAX_RATIO) - 1);
    const chunks = new StubChunks([size]);
    expect(await refusalFromAsync(() => inflaterOver(chunks).inflate(packed))).toContain("unpacks to too much");
    expect(chunks.cancels).toBe(1);
  });

  it("does not check the ratio for a stream no bigger than the size it is checked above", async () => {
    const result = await inflaterOver(new StubChunks([RATIO_CHECKED_ABOVE_BYTES])).inflate(new Uint8Array(1));
    expect(result.byteLength).toBe(RATIO_CHECKED_ABOVE_BYTES);
  });

  it("allows every stream of a file together exactly the most bytes allowed", async () => {
    const totals = new DecompressedTotals();
    const first = inflaterOver(new StubChunks([MAX_STREAM_BYTES]), totals);
    const second = inflaterOver(new StubChunks([MAX_ALL_STREAM_BYTES - MAX_STREAM_BYTES]), totals);
    await first.inflate(new Uint8Array(MAX_STREAM_BYTES));
    const result = await second.inflate(new Uint8Array(MAX_ALL_STREAM_BYTES));
    expect(result.byteLength).toBe(MAX_ALL_STREAM_BYTES - MAX_STREAM_BYTES);
  });

  it("refuses the stream that takes the file's total one byte over, and cancels it once", async () => {
    const totals = new DecompressedTotals();
    await inflaterOver(new StubChunks([MAX_STREAM_BYTES]), totals).inflate(new Uint8Array(MAX_STREAM_BYTES));
    await inflaterOver(new StubChunks([MAX_ALL_STREAM_BYTES - MAX_STREAM_BYTES]), totals).inflate(new Uint8Array(MAX_ALL_STREAM_BYTES));
    const third = new StubChunks([1, 5]);
    expect(await refusalFromAsync(() => inflaterOver(third, totals).inflate(new Uint8Array(MAX_ALL_STREAM_BYTES)))).toContain("unpacks to too much");
    expect(third.cancels).toBe(1);
    expect(third.reads).toBe(1);
  });

  it("refuses with its own words when the platform fails while unpacking", async () => {
    const chunks = new StubChunks([5, 5], 1);
    expect(await refusalFromAsync(() => inflaterOver(chunks).inflate(new Uint8Array(10)))).toContain("could not be unpacked");
  });

  it("asks the platform to start only once for each stream", async () => {
    let starts = 0;
    const inflater = new BoundedInflater(
      () => {
        starts += 1;
        return new StubChunks([1]);
      },
      new WorkBudget(10, () => 0),
      new DecompressedTotals(),
    );
    await inflater.inflate(new Uint8Array(1));
    expect(starts).toBe(1);
  });

  it("looks at the clock while it reads, so a slow unpacking is stopped", async () => {
    let now = 0;
    const work = new WorkBudget(10, () => now);
    now = 1_000_000;
    expect(await refusalFromAsync(() => inflaterOver(new StubChunks([5]), new DecompressedTotals(), work).inflate(new Uint8Array(5)))).toContain("took too long");
  });

  it("raises the work allowed by exactly a fixed number of steps for each byte it unpacked", async () => {
    const work = new WorkBudget(0, () => 0);
    await inflaterOver(new StubChunks([1000]), new DecompressedTotals(), work).inflate(new Uint8Array(100));
    for (let step = 0; step < WORK_EXTRA + WORK_PER_BYTE * 1000; step += 1) work.spend();
    expect(await refusalFromAsync(async () => work.spend())).toContain("takes too much work");
  });
});
