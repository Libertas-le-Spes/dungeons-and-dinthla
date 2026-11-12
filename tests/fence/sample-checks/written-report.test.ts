import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { REPORT_HARMLESS_SAMPLES, REPORT_TELLING_SAMPLES } from "../samples/written-report-samples";

const SAMPLES = [...REPORT_TELLING_SAMPLES, ...REPORT_HARMLESS_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("written-report", SAMPLES, numberedFileNames(SAMPLES));
});

afterAll(() => {
  scan.close();
});

describe("the source scan's rule on the gate's report of written notes", () => {
  it.each(REPORT_TELLING_SAMPLES)("would catch telling the report that a note was written outside the gate's folder with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(REPORT_HARMLESS_SAMPLES)("lets %s pass, since it tells nothing to the report", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).toEqual([]);
  });
});
