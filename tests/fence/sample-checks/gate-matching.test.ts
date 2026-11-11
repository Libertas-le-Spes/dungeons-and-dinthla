import { relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED } from "../scan/running/allowance-sets";
import { SampleScan } from "../scan/running/sample-scan";
import { ROOT, VIRTUAL_FOLDER } from "../scan/reading/scan-paths";
import { FILE_CHANGING_SAMPLES, GATE_FORGING_SAMPLES, GATE_PLACING_SAMPLES, GATE_SHAPING_SAMPLES } from "../samples/gate-forging-samples";
import { FOLDER_WALK_SAMPLES } from "../samples/vault-access-samples";
import { UNREAD_EVENT_SAMPLES } from "../samples/workspace-event-samples";

const SAMPLES = [...FILE_CHANGING_SAMPLES, ...GATE_FORGING_SAMPLES, ...GATE_PLACING_SAMPLES, ...GATE_SHAPING_SAMPLES, ...FOLDER_WALK_SAMPLES, ...UNREAD_EVENT_SAMPLES];
const ORDINARY = "gate-matching/ordinary";
const LOOKALIKES = ["gate-matching/src/fence/gate", "gate-matching/src/fence/paths", "gate-matching/other/src/fence/gate"];
const EXEMPTED = ["builds the gate's", "listens to a workspace event it can't read", "walks the vault's folders unfenced"];
const SAMPLE_PREFIX = '"../../../../src/';

function samplesFor(family: string): string[] {
  const towardsRoot = relative(`${VIRTUAL_FOLDER}/${family}`, ROOT);
  return SAMPLES.map((sample) => sample.replaceAll(SAMPLE_PREFIX, `"${towardsRoot}/src/`));
}

function messageOf(breach: string): string {
  return breach.replace(/^[^:]+:\d+ /, "");
}

function messagesAt(scan: SampleScan, samples: string[]): string[][] {
  return samples.map((sample) => scan.breaches(sample, ALL_ALLOWED).map(messageOf));
}

const scans = new Map<string, SampleScan>();

beforeAll(() => {
  for (const family of [ORDINARY, ...LOOKALIKES]) scans.set(family, new SampleScan(family, samplesFor(family)));
}, 120_000);

afterAll(() => {
  for (const scan of scans.values()) scan.close();
});

function scanOf(family: string): SampleScan {
  const scan = scans.get(family);
  if (scan === undefined) throw new Error(`No scan was made for ${family}.`);
  return scan;
}

describe("the gate's folder, as the source scan knows it", () => {
  it("has samples the scan refuses at an ordinary path for each exemption the gate's folder gets, so the comparison below means something", () => {
    const refused = messagesAt(scanOf(ORDINARY), samplesFor(ORDINARY)).flat();
    for (const exempted of EXEMPTED) expect(refused.some((message) => message.includes(exempted)), exempted).toBe(true);
  }, 120_000);

  it.each(LOOKALIKES)("gives a file whose path only looks like the gate's none of its exemptions: %s", (family) => {
    const ordinary = messagesAt(scanOf(ORDINARY), samplesFor(ORDINARY));
    const looking = messagesAt(scanOf(family), samplesFor(family));
    expect(looking).toEqual(ordinary);
  }, 120_000);
});
