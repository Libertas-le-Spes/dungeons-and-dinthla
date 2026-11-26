import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { ALLOWED_NETWORK_SAMPLES, BEYOND_CALLING_KEEPING_SAMPLES, BEYOND_CALLING_SAMPLES, CHARACTER_ID_FORGING_SAMPLES, CHARACTER_ID_KEEPING_SAMPLES, NETWORK_DEFECT_SAMPLES, NETWORK_NAMING_SAMPLES } from "../samples/network-samples";

const NAMED_OUTSIDE = /^\S+:\d+ names (requestUrl|request), which only the file allowed the network may$/;

const DEFECTED = NETWORK_DEFECT_SAMPLES.map((defect) => defect.sample);
const SAMPLES = [...NETWORK_NAMING_SAMPLES, ...ALLOWED_NETWORK_SAMPLES, ...DEFECTED, ...CHARACTER_ID_FORGING_SAMPLES, ...CHARACTER_ID_KEEPING_SAMPLES, ...BEYOND_CALLING_SAMPLES, ...BEYOND_CALLING_KEEPING_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("network-access", SAMPLES, numberedFileNames(SAMPLES));
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

describe("the source scan's network rules, in the one file allowed the network", () => {
  it.each(ALLOWED_NETWORK_SAMPLES)("lets %s pass, since it is the one call exactly as allowed", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).toEqual([]);
  });

  it.each(NETWORK_DEFECT_SAMPLES)("would catch a defect of the call, even in a file allowed the network", ({ sample, breach }) => {
    const breaches = scan.breaches(sample, ALL_ALLOWED);
    expect(breaches.filter((found) => breach.test(found)), `${sample} gave ${breaches.join(" | ")}`).not.toEqual([]);
  });
});

describe("the source scan's rules on forging a CharacterId", () => {
  it.each(CHARACTER_ID_FORGING_SAMPLES)("would catch forging one outside src/online with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(CHARACTER_ID_KEEPING_SAMPLES)("lets %s pass in a file allowed everything else, since the id comes from CharacterId.of", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).toEqual([]);
  });
});

describe("the source scan's rule on naming what calls D&D Beyond", () => {
  it.each(BEYOND_CALLING_SAMPLES)("would catch %s in a file not allowed to call D&D Beyond", (sample) => {
    const breaches = scan.breaches(sample, NOTHING_ALLOWED);
    expect(breaches).not.toEqual([]);
    for (const breach of breaches) expect(breach).toMatch(/names (callBeyond|BeyondCalls|OBSIDIAN_BEYOND_CALL), which only the files that call D&D Beyond may/);
  });

  it.each(BEYOND_CALLING_SAMPLES)("lets %s pass in a file allowed to call D&D Beyond", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED).filter((breach) => breach.includes("which only the files that call D&D Beyond may"))).toEqual([]);
  });

  it.each(BEYOND_CALLING_KEEPING_SAMPLES)("lets %s pass anywhere, since it names neither", (sample) => {
    expect(scan.breaches(sample, NOTHING_ALLOWED)).toEqual([]);
  });
});
