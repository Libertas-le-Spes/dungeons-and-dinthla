import { basename, dirname, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { GATE_TYPE_SOURCES } from "../scan/reading/gate-paths";
import { ROOT, VIRTUAL_FOLDER } from "../scan/reading/scan-paths";
import { FILE_CHANGING_SAMPLES, GATE_FORGING_SAMPLES, GATE_PLACING_SAMPLES, GATE_SHAPING_SAMPLES } from "../samples/gate-forging-samples";
import { ALLOWED_OPENING_SAMPLES } from "../samples/opening-samples";
import { FOLDER_WALK_SAMPLES } from "../samples/vault-access-samples";
import { UNREAD_EVENT_SAMPLES } from "../samples/workspace-event-samples";

interface Placement {
  family: string;
  fileNames: string[];
}

const SAMPLES = [
  ...FILE_CHANGING_SAMPLES,
  ...GATE_FORGING_SAMPLES,
  ...GATE_PLACING_SAMPLES,
  ...GATE_SHAPING_SAMPLES,
  ...FOLDER_WALK_SAMPLES,
  ...UNREAD_EVENT_SAMPLES,
  ...ALLOWED_OPENING_SAMPLES,
];
const SAMPLE_PREFIX = '"../../../../src/';

function numbered(family: string): Placement {
  return { family, fileNames: numberedFileNames(SAMPLES) };
}

function namedAfter(gateFile: string): Placement {
  return { family: `gate-matching/named-${basename(gateFile, ".ts")}`, fileNames: SAMPLES.map((_sample, index) => `sample-${index}/${gateFile}`) };
}

const ORDINARY = numbered("gate-matching/ordinary");
const LOOKALIKES = ["gate-matching/src/fence/gate", "gate-matching/src/fence/paths", "gate-matching/other/src/fence/gate"].map(numbered);
const NAMED_AFTER_THE_GATE = GATE_TYPE_SOURCES.map((path) => namedAfter(basename(path)));
const PLACEMENTS = [ORDINARY, ...LOOKALIKES, ...NAMED_AFTER_THE_GATE];

function samplesFor(placement: Placement): string[] {
  return SAMPLES.map((sample, index) => {
    const folder = dirname(`${VIRTUAL_FOLDER}/${placement.family}/${placement.fileNames[index]}`);
    return sample.replaceAll(SAMPLE_PREFIX, `"${relative(folder, ROOT)}/src/`);
  });
}

function messageOf(breach: string): string {
  return breach.replace(/^[^:]+:\d+ /, "");
}

function messagesAt(scan: SampleScan, samples: string[]): string[][] {
  return samples.map((sample) => scan.breaches(sample, ALL_ALLOWED).map(messageOf));
}

const scans = new Map<string, SampleScan>();

beforeAll(() => {
  for (const placement of PLACEMENTS) scans.set(placement.family, new SampleScan(placement.family, samplesFor(placement), placement.fileNames));
}, 300_000);

afterAll(() => {
  for (const scan of scans.values()) scan.close();
});

function scanOf(placement: Placement): SampleScan {
  const scan = scans.get(placement.family);
  if (scan === undefined) throw new Error(`No scan was made for ${placement.family}.`);
  return scan;
}

describe("the samples the gate's folder is tested with", () => {
  it("write every path into src with the prefix that is rewritten for each family", () => {
    expect(SAMPLES.filter((sample) => sample.includes("/src/") && !sample.includes(SAMPLE_PREFIX))).toEqual([]);
  });

  it("include some that reach into src, so that is not an empty search", () => {
    expect(SAMPLES.filter((sample) => sample.includes(SAMPLE_PREFIX)).length).toBeGreaterThan(0);
  });

  it.each(PLACEMENTS)("have none left unrewritten, in $family", (placement) => {
    expect(samplesFor(placement).filter((sample) => sample.includes(SAMPLE_PREFIX))).toEqual([]);
  });
});

describe("the gate's folder, as the source scan knows it", () => {
  it("has every sample refused at an ordinary path, so the comparisons below mean something", () => {
    const scan = scanOf(ORDINARY);
    expect(samplesFor(ORDINARY).filter((sample) => scan.breaches(sample, ALL_ALLOWED).length === 0)).toEqual([]);
  }, 120_000);

  it.each(LOOKALIKES)("gives a file whose path only looks like the gate's none of its exemptions: $family", (placement) => {
    const ordinary = messagesAt(scanOf(ORDINARY), samplesFor(ORDINARY));
    expect(messagesAt(scanOf(placement), samplesFor(placement))).toEqual(ordinary);
  }, 120_000);

  it.each(NAMED_AFTER_THE_GATE)("gives a file named like one of the gate's, outside its folder, none of its exemptions: $family", (placement) => {
    const ordinary = messagesAt(scanOf(ORDINARY), samplesFor(ORDINARY));
    expect(messagesAt(scanOf(placement), samplesFor(placement))).toEqual(ordinary);
  }, 120_000);
});
