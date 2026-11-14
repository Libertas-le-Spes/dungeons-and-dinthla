import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { NETWORK_NAMING_SAMPLES } from "../samples/network-samples";

const NAMED_OUTSIDE = /^\S+:\d+ names (requestUrl|request), which only the file allowed the network may$/;

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("network-access", NETWORK_NAMING_SAMPLES, numberedFileNames(NETWORK_NAMING_SAMPLES));
});

afterAll(() => {
  scan.close();
});

describe("the source scan's network rules, in a file not allowed the network", () => {
  it.each(NETWORK_NAMING_SAMPLES)("would catch naming requestUrl or request with %s", (sample) => {
    const breaches = scan.breaches(sample, NOTHING_ALLOWED);
    expect(breaches).not.toEqual([]);
    for (const breach of breaches) expect(breach).toMatch(NAMED_OUTSIDE);
  });

  it.each(NETWORK_NAMING_SAMPLES)("would catch naming requestUrl or request with %s, even in a file allowed everything else but the network", (sample) => {
    const breaches = scan.breaches(sample, { ...ALL_ALLOWED, network: () => false });
    expect(breaches.filter((breach) => NAMED_OUTSIDE.test(breach))).not.toEqual([]);
  });
});
