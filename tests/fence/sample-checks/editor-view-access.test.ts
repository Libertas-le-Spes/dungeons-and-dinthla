import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, LOOSE_CASTS_ALLOWED } from "../scan/running/allowance-sets";
import { SampleScan } from "../scan/running/sample-scan";
import { CODE_MIRROR_SAMPLES, NOTE_READING_SAMPLES, READING_SAMPLES, VIEW_TEXT_SAMPLES, WRITE_NAME_SAMPLES, WRITING_SAMPLES } from "../samples/editor-view-samples";

const SAMPLES = [...WRITING_SAMPLES, ...WRITE_NAME_SAMPLES, ...READING_SAMPLES, ...NOTE_READING_SAMPLES, ...VIEW_TEXT_SAMPLES, ...CODE_MIRROR_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("editor-view", SAMPLES);
});

afterAll(() => {
  scan.close();
});

describe("the source scan's editor and view rules", () => {
  it.each(WRITING_SAMPLES)("would catch writing through an editor or view with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(WRITE_NAME_SAMPLES)("would catch writing through an editor or view with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(READING_SAMPLES)("would catch reading an editor's or view's text with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(NOTE_READING_SAMPLES)("would catch reading a note's text through Obsidian with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(VIEW_TEXT_SAMPLES)("would catch reading the text of a view's element with %s", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(CODE_MIRROR_SAMPLES)("would catch reaching the editor through CodeMirror with %s", (sample) => {
    expect(scan.breaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });
});
