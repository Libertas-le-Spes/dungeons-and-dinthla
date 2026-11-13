import { dirname, relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED } from "../scan/running/allowance-sets";
import { numberedFileNames, SampleScan } from "../scan/running/sample-scan";
import { ROOT, VIRTUAL_FOLDER } from "../scan/reading/scan-paths";
import { FILE_CHANGING_SAMPLES, GATE_FORGING_SAMPLES, GATE_PLACING_SAMPLES, GATE_SHAPING_SAMPLES } from "../samples/gate-forging-samples";
import { ALLOWED_OPENING_SAMPLES } from "../samples/opening-samples";
import { FOLDER_WALK_SAMPLES } from "../samples/vault-access-samples";
import { UNREAD_EVENT_SAMPLES } from "../samples/workspace-event-samples";

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
const FILE_NAMES = numberedFileNames(SAMPLES);
const LOOKALIKE_FAMILIES = [
  "gate-matching/src/fence/gate",
  "gate-matching/src/fence/paths",
  "gate-matching/other/src/fence/gate",
  "gate-matching/src/fence/gate-extra",
  "gate-matching/src/fence/gates",
];

interface Placement {
  family: string;
  samples: string[];
  scan: SampleScan;
}

interface PlacedSample {
  family: string;
  position: number;
}

function fileNameAt(position: number): string {
  const name = FILE_NAMES[position];
  if (name === undefined) throw new Error(`Sample ${position} has no file name.`);
  return name;
}

function samplesFor(family: string): string[] {
  const rewritten: string[] = [];
  for (const [position, sample] of SAMPLES.entries()) {
    const folder = dirname(`${VIRTUAL_FOLDER}/${family}/${fileNameAt(position)}`);
    rewritten.push(sample.replaceAll(SAMPLE_PREFIX, `"${relative(folder, ROOT)}/src/`));
  }
  return rewritten;
}

function placed(family: string): Placement {
  const samples = samplesFor(family);
  return { family, samples, scan: new SampleScan(family, samples, FILE_NAMES) };
}

const ORDINARY = placed("gate-matching/ordinary");
const LOOKALIKES = new Map<string, Placement>();
for (const family of LOOKALIKE_FAMILIES) LOOKALIKES.set(family, placed(family));

afterAll(() => {
  ORDINARY.scan.close();
  for (const placement of LOOKALIKES.values()) placement.scan.close();
});

function messageOf(breach: string): string {
  return breach.replace(/^[^:]+:\d+ /, "");
}

function messagesAt(placement: Placement, position: number): string[] {
  const sample = placement.samples[position];
  if (sample === undefined) throw new Error(`${placement.family} has no sample at ${position}.`);
  const messages: string[] = [];
  for (const breach of placement.scan.breaches(sample, ALL_ALLOWED)) messages.push(messageOf(breach));
  return messages;
}

function lookalikeOf(family: string): Placement {
  const placement = LOOKALIKES.get(family);
  if (placement === undefined) throw new Error(`${family} was never opened.`);
  return placement;
}

function placedSamples(): PlacedSample[] {
  const rows: PlacedSample[] = [];
  for (const family of LOOKALIKE_FAMILIES) {
    for (const position of SAMPLES.keys()) rows.push({ family, position });
  }
  return rows;
}

function holdsPrefix(sample: string): boolean {
  return sample.includes(SAMPLE_PREFIX);
}

function reachesSourceUnprefixed(sample: string): boolean {
  return sample.includes("/src/") && !holdsPrefix(sample);
}

describe("the samples the gate's folder is tested with", () => {
  it("write every path into src with the prefix that is rewritten for each family", () => {
    expect(SAMPLES.filter(reachesSourceUnprefixed)).toEqual([]);
  });

  it("include some that reach into src, so that is not an empty search", () => {
    expect(SAMPLES.filter(holdsPrefix)).not.toEqual([]);
  });

  it.each(["gate-matching/ordinary", ...LOOKALIKE_FAMILIES])("have none left unrewritten, in %s", (family) => {
    expect(samplesFor(family).filter(holdsPrefix)).toEqual([]);
  });
});

describe("the gate's folder, as the source scan knows it", () => {
  it.each([...SAMPLES.keys()])("refuses sample %i at an ordinary path, so the comparisons below mean something", (position) => {
    expect(messagesAt(ORDINARY, position)).not.toEqual([]);
  });

  it.each(placedSamples())("gives sample $position none of the gate's exemptions in $family, whose path only looks like the gate's", ({ family, position }) => {
    expect(messagesAt(lookalikeOf(family), position)).toEqual(messagesAt(ORDINARY, position));
  });
});
