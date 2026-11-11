import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Allowances } from "../scan/reading/allowances";
import { NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { ALLOWED_GLOBAL_SAMPLES, GLOBAL_SAMPLES } from "../samples/global-samples";
import { ALLOWED_IMPORT_SAMPLES, IMPORT_SAMPLES } from "../samples/import-samples";

const SAMPLES = [...IMPORT_SAMPLES, ...ALLOWED_IMPORT_SAMPLES, ...GLOBAL_SAMPLES, ...ALLOWED_GLOBAL_SAMPLES];

const SAMPLE_IMPORTS = ["App", "Notice", "TFile"];

const SAMPLE_GLOBALS = ["undefined", "Set", "HTMLElement"];

function isSampleImport(_path: string, name: string): boolean {
  return SAMPLE_IMPORTS.includes(name);
}

function isSampleGlobal(_path: string, name: string): boolean {
  return SAMPLE_GLOBALS.includes(name);
}

const LISTED: Allowances = { ...NOTHING_ALLOWED, obsidianImports: isSampleImport, globals: isSampleGlobal };

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("imports-and-globals", SAMPLES, numberedFileNames(SAMPLES));
});

afterAll(() => {
  scan.close();
});

describe("the source scan's import and global rules", () => {
  it.each(IMPORT_SAMPLES)("would catch importing what the file isn't allowed, or a module the plugin doesn't use, with %s", (sample) => {
    expect(scan.breaches(sample, LISTED)).not.toEqual([]);
  });

  it.each(ALLOWED_IMPORT_SAMPLES)("lets %s pass, since it imports only the names the file is allowed", (sample) => {
    expect(scan.breaches(sample, LISTED)).toEqual([]);
  });

  it.each(GLOBAL_SAMPLES)("would catch using a global the file isn't allowed with %s", (sample) => {
    expect(scan.breaches(sample, LISTED)).not.toEqual([]);
  });

  it.each(ALLOWED_GLOBAL_SAMPLES)("lets %s pass, since it uses only the globals the file is allowed", (sample) => {
    expect(scan.breaches(sample, LISTED)).toEqual([]);
  });
});
