import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { FENCED_NOTES_BUILDING_SAMPLE, FENCED_NOTES_CASTING_SAMPLES } from "../samples/fenced-notes-samples";

const SAMPLES = [FENCED_NOTES_BUILDING_SAMPLE, ...FENCED_NOTES_CASTING_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("fenced-notes", SAMPLES, numberedFileNames(SAMPLES));
});

afterAll(() => {
  scan.close();
});

describe("the source scan's fenced notes rules", () => {
  it("would catch building the fenced notes in a file not allowed to", () => {
    expect(scan.breaches(FENCED_NOTES_BUILDING_SAMPLE, NOTHING_ALLOWED).filter((breach) => breach.includes("builds the fenced notes"))).toHaveLength(1);
  });

  it("lets the file allowed to build the fenced notes build them", () => {
    expect(scan.breaches(FENCED_NOTES_BUILDING_SAMPLE, ALL_ALLOWED).filter((breach) => breach.includes("fenced notes"))).toEqual([]);
  });

  it.each(FENCED_NOTES_CASTING_SAMPLES)("would catch casting a value to the fenced notes with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).toEqual([expect.stringContaining("casts to the fenced notes")]);
  });
});
