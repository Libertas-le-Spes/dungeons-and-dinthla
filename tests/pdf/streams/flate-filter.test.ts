import { describe, expect, it } from "vitest";
import { FlateFilter } from "../../../src/pdf/streams/flate-filter";
import { BoundedInflater } from "../../../src/pdf/streams/inflate/bounded-inflater";
import { DecompressedTotals } from "../../../src/pdf/streams/inflate/decompressed-totals";
import type { InflatedChunks } from "../../../src/pdf/streams/inflate/inflated-chunks";
import { WorkBudget } from "../../../src/pdf/work/work-budget";
import { PdfAbsent } from "../../../src/pdf/values/scalars/pdf-absent";
import { parsed, refusalFromAsync } from "../support/parsed";

class OneChunk implements InflatedChunks {
  private given = false;

  constructor(private readonly chunk: Uint8Array) {}

  async next(): Promise<Uint8Array | null> {
    if (this.given) return null;
    this.given = true;
    return this.chunk;
  }

  async cancel(): Promise<void> {}
}

function filterGiving(unpacked: number[], starts: Uint8Array[] = []): FlateFilter {
  const work = new WorkBudget(100, () => 0);
  const inflater = new BoundedInflater(
    (compressed) => {
      starts.push(compressed);
      return new OneChunk(Uint8Array.from(unpacked));
    },
    work,
    new DecompressedTotals(),
  );
  return new FlateFilter(inflater, work);
}

describe("FlateFilter", () => {
  it("goes by the name FlateDecode and no other", () => {
    const filter = filterGiving([]);
    expect(filter.named("FlateDecode")).toBe(true);
    expect(filter.named("Fl")).toBe(false);
    expect(filter.named("LZWDecode")).toBe(false);
  });

  it("gives what the inflater gives when there is no prediction", async () => {
    const starts: Uint8Array[] = [];
    const result = await filterGiving([1, 2, 3], starts).decode(Uint8Array.from([9, 9]), PdfAbsent.ABSENT, true);
    expect([...result]).toEqual([1, 2, 3]);
    expect(starts.map((packed) => [...packed])).toEqual([[9, 9]]);
  });

  it("undoes the up predictor on what the inflater gives", async () => {
    const result = await filterGiving([2, 5, 2, 1]).decode(new Uint8Array(1), parsed("<< /Predictor 12 /Columns 1 >>"), true);
    expect([...result]).toEqual([5, 6]);
  });

  it("refuses a predictor where it is not allowed, before it inflates anything", async () => {
    const starts: Uint8Array[] = [];
    const reason = await refusalFromAsync(() => filterGiving([2, 5], starts).decode(new Uint8Array(1), parsed("<< /Predictor 12 >>"), false));
    expect(reason).toContain("settings the reader does not understand");
    expect(starts).toEqual([]);
  });
});
