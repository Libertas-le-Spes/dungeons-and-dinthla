import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NOTHING_ALLOWED } from "./scan/allowance-sets";
import { SampleScan } from "./scan/sample-scan";
import { ALLOWED_PAGE_SAMPLES, CODE_TEXT_SAMPLES, PAGE_ELEMENT_SAMPLES, PAGE_TEXT_SAMPLES } from "./samples/page-samples";

const SAMPLES = [...CODE_TEXT_SAMPLES, ...PAGE_ELEMENT_SAMPLES, ...PAGE_TEXT_SAMPLES, ...ALLOWED_PAGE_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("page", SAMPLES);
});

afterAll(() => {
  scan.close();
});

describe("the source scan's page rules", () => {
  it.each(CODE_TEXT_SAMPLES)("would catch running text as code with %s", (sample) => {
    expect(scan.breaches(sample, NOTHING_ALLOWED)).not.toEqual([]);
  });

  it.each(PAGE_ELEMENT_SAMPLES)("would catch making an element or setting a style that could load from an address with %s", (sample) => {
    expect(scan.breaches(sample, NOTHING_ALLOWED)).not.toEqual([]);
  });

  it.each(PAGE_TEXT_SAMPLES)("would catch reading the page's text, or what Obsidian renders, with %s", (sample) => {
    expect(scan.breaches(sample, NOTHING_ALLOWED)).not.toEqual([]);
  });

  it.each(ALLOWED_PAGE_SAMPLES)("lets %s pass, since it uses the page only as the plugin is allowed", (sample) => {
    expect(scan.breaches(sample, NOTHING_ALLOWED)).toEqual([]);
  });
});
