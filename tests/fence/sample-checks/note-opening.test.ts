import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, isNeverAllowed } from "../scan/running/allowance-sets";
import { SampleScan } from "../scan/running/sample-scan";
import { ALLOWED_OPENING_SAMPLES, GATED_OPENING_SAMPLES, LEAF_SAMPLES, LEAF_VIEW_SAMPLES, OPENING_SAMPLES, VIEW_FILE_SAMPLES } from "../samples/opening-samples";

const SAMPLES = [...OPENING_SAMPLES, ...ALLOWED_OPENING_SAMPLES, ...GATED_OPENING_SAMPLES, ...LEAF_SAMPLES, ...LEAF_VIEW_SAMPLES, ...VIEW_FILE_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("opening", SAMPLES);
});

afterAll(() => {
  scan.close();
});

describe("the source scan's note opening rules", () => {
  it.each(OPENING_SAMPLES)("would catch opening, showing or picking a note outside the gate with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(ALLOWED_OPENING_SAMPLES)("would catch opening a file that doesn't come from the gate, or a way around that check, with %s, even in a file allowed to open files", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(GATED_OPENING_SAMPLES)("lets %s pass in a file allowed to open files, since the file comes from the gate", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).toEqual([]);
  });

  it.each(LEAF_SAMPLES)("would catch reaching a leaf other than through the campaign tab, or opening a view in one, with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(LEAF_VIEW_SAMPLES)("would catch reading a leaf's view with %s, in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, { ...ALL_ALLOWED, leafView: isNeverAllowed })).not.toEqual([]);
  });

  it.each(VIEW_FILE_SAMPLES)("would catch reading a view's file with %s, in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, { ...ALL_ALLOWED, viewFile: isNeverAllowed })).not.toEqual([]);
  });
});
