import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, isNeverAllowed } from "./scan/allowance-sets";
import { SampleScan } from "./scan/sample-scan";
import { HARMLESS_EVENT_SAMPLES, NOTE_EVENT_SAMPLES, UNREAD_EVENT_SAMPLES } from "./samples/workspace-event-samples";

const SAMPLES = [...NOTE_EVENT_SAMPLES, ...UNREAD_EVENT_SAMPLES, ...HARMLESS_EVENT_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("workspace-events", SAMPLES);
});

afterAll(() => {
  scan.close();
});

describe("the source scan's workspace event rules", () => {
  it.each(NOTE_EVENT_SAMPLES)("would catch listening to a workspace event that hands over any note with %s, in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, { ...ALL_ALLOWED, noteEvents: isNeverAllowed })).not.toEqual([]);
  });

  it.each(UNREAD_EVENT_SAMPLES)("would catch listening to a workspace event the scan can't read with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(HARMLESS_EVENT_SAMPLES)("lets %s pass, since the event hands over no note", (sample) => {
    expect(scan.breaches(sample)).toEqual([]);
  });
});
