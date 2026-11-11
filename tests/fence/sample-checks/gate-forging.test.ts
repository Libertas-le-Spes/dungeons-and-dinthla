import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED } from "../scan/running/allowance-sets";
import { SampleScan } from "../scan/running/sample-scan";
import { FILE_CHANGING_SAMPLES, GATE_FORGING_SAMPLES, GATE_KEEPING_SAMPLES, GATE_PLACING_SAMPLES, GATE_SHAPING_SAMPLES } from "../samples/gate-forging-samples";

const SAMPLES = [...GATE_FORGING_SAMPLES, ...GATE_PLACING_SAMPLES, ...GATE_SHAPING_SAMPLES, ...GATE_KEEPING_SAMPLES, ...FILE_CHANGING_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("gate-forging", SAMPLES);
});

afterAll(() => {
  scan.close();
});

describe("the source scan's gate forging rules", () => {
  it.each(GATE_FORGING_SAMPLES)("would catch forging or changing a gate outside the gate's folder with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(FILE_CHANGING_SAMPLES)("would catch changing a vault file outside the gate's folder with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(GATE_PLACING_SAMPLES)("would catch putting a value the gate didn't give where the gate's parts go with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(GATE_SHAPING_SAMPLES)("would catch building, extending or narrowing to a gate outside the gate's folder with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(GATE_KEEPING_SAMPLES)("lets %s pass in a file allowed everything else, since every gate part comes from the gate", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).toEqual([]);
  });
});
