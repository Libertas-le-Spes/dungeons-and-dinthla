import { describe, expect, it } from "vitest";
import { undoUpPredictor } from "../../../src/pdf/streams/png-up-predictor";
import { budgetFor } from "../support/cursors";
import { refusalFrom } from "../support/parsed";
import { withUpPredictor } from "../writer/up-predictor";

function unrolled(packed: Uint8Array, columns: number): number[] {
  return [...undoUpPredictor(packed, columns, budgetFor(packed.byteLength))];
}

describe("undoUpPredictor", () => {
  it("gives back rows that were predicted from the row above", () => {
    const rows = [Buffer.from([1, 2, 3]), Buffer.from([4, 5, 6]), Buffer.from([4, 9, 0])];
    expect(unrolled(withUpPredictor(rows), 3)).toEqual([1, 2, 3, 4, 5, 6, 4, 9, 0]);
  });

  it("adds a difference to the byte above and wraps at 256", () => {
    expect(unrolled(Uint8Array.from([2, 200, 2, 100]), 1)).toEqual([200, 44]);
  });

  it("reads the first row as differences from zero", () => {
    expect(unrolled(Uint8Array.from([2, 7, 8]), 2)).toEqual([7, 8]);
  });

  it("gives nothing for no rows", () => {
    expect(unrolled(new Uint8Array(0), 3)).toEqual([]);
  });

  it.each([0, 1, 3, 4, 255])("refuses a row tagged %s, because only the up tag is read", (tag) => {
    expect(refusalFrom(() => unrolled(Uint8Array.from([tag, 1, 2]), 2))).toContain("laid out in rows");
  });

  it("refuses a later row with a different tag", () => {
    expect(refusalFrom(() => unrolled(Uint8Array.from([2, 1, 2, 1, 1, 2]), 2))).toContain("laid out in rows");
  });

  it("refuses data that is not a whole number of rows", () => {
    expect(refusalFrom(() => unrolled(Uint8Array.from([2, 1, 2, 2]), 2))).toContain("laid out in rows");
  });

  it("refuses no columns", () => {
    expect(refusalFrom(() => unrolled(new Uint8Array(0), 0))).toContain("laid out in rows");
  });

  it("spends one step for each byte it unrolls", () => {
    const work = budgetFor(10);
    undoUpPredictor(Uint8Array.from([2, 1, 2, 2, 1, 2]), 2, work);
    expect(work.stepsTaken()).toBe(4);
  });
});
