import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isNeverAllowed, NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { HOST_SAMPLES, HOST_TYPE_SAMPLES, NEUTRAL_SAMPLES, type ReachSample } from "../samples/host-samples";
import type { Allowances } from "../scan/reading/allowances";
import { isCoreSource } from "../scan/reading/host-sides";
import { SOURCE_FOLDER } from "../scan/reading/scan-paths";

const SAMPLES = [...HOST_SAMPLES, ...HOST_TYPE_SAMPLES.map(textOf), ...NEUTRAL_SAMPLES];

function textOf(sample: ReachSample): string {
  return sample.text;
}

function lastLineOf(text: string): number {
  return text.split("\n").length;
}

const HOST_REFUSED: Allowances = { ...NOTHING_ALLOWED, hostNeutral: isNeverAllowed };

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("host", SAMPLES, numberedFileNames(SAMPLES));
});

afterAll(() => {
  scan.close();
});

function hostBreaches(sample: string): string[] {
  const found: string[] = [];
  for (const breach of scan.breaches(sample, HOST_REFUSED)) {
    if (breach.includes("Obsidian or CodeMirror")) found.push(breach);
  }
  return found;
}

describe("the source scan's rule that the plugin's own code is Obsidian's no more", () => {
  it.each(HOST_SAMPLES)("would catch using what Obsidian or CodeMirror declares with %s", (sample) => {
    expect(hostBreaches(sample)).not.toEqual([]);
  });

  it.each(HOST_TYPE_SAMPLES)("would catch a plugin name whose type reaches an Obsidian type only through $route", ({ text }) => {
    expect(hostBreaches(text)).toEqual(expect.arrayContaining([expect.stringContaining(`:${lastLineOf(text)} holds kept, whose type reaches`)]));
  });

  it.each(NEUTRAL_SAMPLES)("lets %s pass, since it uses only the plugin's own and the browser's", (sample) => {
    expect(hostBreaches(sample)).toEqual([]);
  });

  it.each(HOST_SAMPLES)("lets %s pass in a file allowed to be tied to Obsidian", (sample) => {
    const tied: string[] = [];
    for (const breach of scan.breaches(sample, NOTHING_ALLOWED)) {
      if (breach.includes("Obsidian or CodeMirror")) tied.push(breach);
    }
    expect(tied).toEqual([]);
  });
});

describe("which source is the plugin's own", () => {
  it.each(["funds/page/funds-page.ts", "obsidian-notes/made-up.ts", "names/name-key.ts"])("counts %s as the plugin's own", (path) => {
    expect(isCoreSource(`${SOURCE_FOLDER}${path}`)).toBe(true);
  });

  it.each(["obsidian/funds/page/funds-page-view.ts", "fence/gate/fenced-files.ts", "main.ts"])("counts %s as the Obsidian side", (path) => {
    expect(isCoreSource(`${SOURCE_FOLDER}${path}`)).toBe(false);
  });
});
