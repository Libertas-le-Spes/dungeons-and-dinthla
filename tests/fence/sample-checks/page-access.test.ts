import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isAnyNameAllowed, isNoNameAllowed, NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { ADDED_MEMBER_SAMPLES, ALLOWED_PAGE_SAMPLES, CODE_TEXT_SAMPLES, ESCAPE_SAMPLES, NOT_PAGE_SAMPLES, OWN_ELEMENT_SAMPLES, PAGE_ELEMENT_SAMPLES, PAGE_READ_SAMPLES, PAGE_TEXT_SAMPLES } from "../samples/page-samples";
import type { Allowances } from "../scan/reading/allowances";
import { PAGE_ESCAPES } from "../scan/reading/names";

const SAMPLES = [...ADDED_MEMBER_SAMPLES, ...CODE_TEXT_SAMPLES, ...PAGE_ELEMENT_SAMPLES, ...PAGE_TEXT_SAMPLES, ...ALLOWED_PAGE_SAMPLES, ...PAGE_READ_SAMPLES, ...OWN_ELEMENT_SAMPLES, ...NOT_PAGE_SAMPLES, ...ESCAPE_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("page", SAMPLES, numberedFileNames(SAMPLES));
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

const OWN_ELEMENT_MEMBERS = ["createDiv", "addClass"];

function isOwnElementMember(_path: string, name: string): boolean {
  return OWN_ELEMENT_MEMBERS.includes(name);
}

const OWN_ELEMENTS_ONLY: Allowances = { ...NOTHING_ALLOWED, pageMembers: isOwnElementMember };

describe("the source scan's page member allow-list", () => {
  it.each(PAGE_READ_SAMPLES)("would catch reaching past the file's own elements to read the page with %s", (sample) => {
    expect(scan.breaches(sample, OWN_ELEMENTS_ONLY)).not.toEqual([]);
  });

  it.each(ADDED_MEMBER_SAMPLES)("would catch a member the file adds to the page's elements itself with %s", (sample) => {
    expect(scan.breaches(sample, OWN_ELEMENTS_ONLY)).not.toEqual([]);
  });

  it.each(OWN_ELEMENT_SAMPLES)("lets %s pass, since it uses only the members the file is allowed on its own elements", (sample) => {
    expect(scan.breaches(sample, OWN_ELEMENTS_ONLY)).toEqual([]);
  });
});

function isNoEscape(_path: string, name: string): boolean {
  if (PAGE_ESCAPES.includes(name)) return false;
  return true;
}

const ALL_BUT_ESCAPES: Allowances = { ...NOTHING_ALLOWED, pageMembers: isNoEscape };

describe("the source scan's escapes past a file's own elements", () => {
  it.each(PAGE_READ_SAMPLES)("would catch reaching past the file's own elements with %s, though every other page member is allowed", (sample) => {
    expect(scan.breaches(sample, ALL_BUT_ESCAPES)).not.toEqual([]);
  });
});

const NO_PAGE_MEMBERS: Allowances = { ...NOTHING_ALLOWED, pageMembers: isNoNameAllowed };

describe("the source scan's page members, beside Obsidian's other additions", () => {
  it.each(NOT_PAGE_SAMPLES)("lets %s pass with no page member allowed, since what it uses isn't the page's", (sample) => {
    expect(scan.breaches(sample, NO_PAGE_MEMBERS)).toEqual([]);
  });
});

const EVERY_PAGE_MEMBER: Allowances = { ...NOTHING_ALLOWED, pageMembers: isAnyNameAllowed };

describe("the source scan's escapes, one name each", () => {
  it.each(ESCAPE_SAMPLES)("finds the one page member in %s with no page member allowed", (sample) => {
    expect(scan.breaches(sample, NO_PAGE_MEMBERS)).toHaveLength(1);
  });

  it.each(ESCAPE_SAMPLES)("finds the one escape in %s with every page member allowed but the escapes", (sample) => {
    expect(scan.breaches(sample, ALL_BUT_ESCAPES)).toHaveLength(1);
  });

  it.each(ESCAPE_SAMPLES)("lets %s pass with every page member allowed", (sample) => {
    expect(scan.breaches(sample, EVERY_PAGE_MEMBER)).toEqual([]);
  });
});
