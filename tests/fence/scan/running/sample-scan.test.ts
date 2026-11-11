import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OPTION_DEPENDENT_SAMPLES, OPTION_FREE_SAMPLE } from "../../samples/compiler-option-samples";
import { ROOT, VIRTUAL_FOLDER } from "../reading/scan-paths";
import { ALL_ALLOWED } from "./allowance-sets";
import { extendsRootConfig, SampleScan } from "./sample-scan";
import { SourceScanner } from "./source-scanner";
import { virtualFileSystem } from "./virtual-files";

const FAMILIES = ["one", "one/two", "one/two/three", "one/two/three/four"];
const SAMPLES = [...OPTION_DEPENDENT_SAMPLES, OPTION_FREE_SAMPLE];

describe("the configuration a sample is scanned under", () => {
  it.each(FAMILIES)("is the repo's own, from a family folder %s deep", (family) => {
    const folder = `${VIRTUAL_FOLDER}/${family}`;
    expect(resolve(folder, extendsRootConfig(folder))).toBe(`${ROOT}/tsconfig.json`);
  });
});

describe("a sample scan, from a family folder at each depth", () => {
  const scans = new Map<string, SampleScan>();

  beforeAll(() => {
    for (const family of FAMILIES) scans.set(family, new SampleScan(family, SAMPLES));
  });

  afterAll(() => {
    for (const scan of scans.values()) scan.close();
  });

  function scanOf(family: string): SampleScan {
    const scan = scans.get(family);
    if (scan === undefined) throw new Error(`No scan was made for ${family}.`);
    return scan;
  }

  it.each(FAMILIES)("reads the repo's compiler options, so a key that only the strict options make unsafe is refused, in %s", (family) => {
    for (const sample of OPTION_DEPENDENT_SAMPLES) expect(scanOf(family).breaches(sample, ALL_ALLOWED), sample).not.toEqual([]);
  });

  it.each(FAMILIES)("lets a key that is safe under any options pass, in %s", (family) => {
    expect(scanOf(family).breaches(OPTION_FREE_SAMPLE, ALL_ALLOWED)).toEqual([]);
  });
});

describe("a scan whose configuration extends a file that isn't there", () => {
  const FOLDER = `${VIRTUAL_FOLDER}/sample-scan/missing`;
  const CONFIG = `${FOLDER}/tsconfig.json`;
  const SAMPLE = `${FOLDER}/sample.ts`;

  it("fails with the reason, instead of scanning under no options", () => {
    const files = new Map<string, string>([
      [SAMPLE, OPTION_FREE_SAMPLE],
      [CONFIG, JSON.stringify({ extends: "./nothing-here.json", files: ["sample.ts"], include: [] })],
    ]);
    const scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, files));
    try {
      expect(() => scanner.breaches(CONFIG, [SAMPLE], ALL_ALLOWED)).toThrow("Cannot read file");
    } finally {
      scanner.close();
    }
  });
});
