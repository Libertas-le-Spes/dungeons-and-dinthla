import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_ALLOWED, LOOSE_CASTS_ALLOWED } from "./scan/allowance-sets";
import { SampleScan } from "./scan/sample-scan";
import {
  CAST_SAMPLES,
  CONSTRUCTOR_SAMPLES,
  FILE_TREE_SAMPLES,
  FOLDER_WALK_SAMPLES,
  FORBIDDEN_SAMPLES,
  GLOBAL_APP_SAMPLES,
  HARMLESS_SAMPLES,
  LOOSE_CAST_SAMPLES,
  OTHER_PLUGIN_SAMPLES,
  REACHING_SAMPLES,
  WIDENING_SAMPLES,
} from "./samples/vault-access-samples";

const SAMPLES = [...REACHING_SAMPLES, ...FORBIDDEN_SAMPLES, ...FILE_TREE_SAMPLES, ...FOLDER_WALK_SAMPLES, ...CAST_SAMPLES, ...LOOSE_CAST_SAMPLES, ...OTHER_PLUGIN_SAMPLES, ...GLOBAL_APP_SAMPLES, ...CONSTRUCTOR_SAMPLES, ...WIDENING_SAMPLES, ...HARMLESS_SAMPLES];

let scan: SampleScan;

beforeAll(() => {
  scan = new SampleScan("vault-access", SAMPLES);
});

afterAll(() => {
  scan.close();
});

describe("the source scan's vault access rules", () => {
  it.each(REACHING_SAMPLES)("would catch reaching the vault with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(FORBIDDEN_SAMPLES)("would catch rendering, running a command, running text as code or following a link unfenced with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(FILE_TREE_SAMPLES)("would catch walking the vault's folders with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(FOLDER_WALK_SAMPLES)("would catch walking a folder's files past the fence with %s, even in a file allowed everything else", (sample) => {
    expect(scan.breaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(CAST_SAMPLES)("would catch a computed key on a value cast through unknown or any with %s, even in a file allowed to cast", (sample) => {
    expect(scan.breaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });

  it.each(LOOSE_CAST_SAMPLES)("would catch casting through unknown or any with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(OTHER_PLUGIN_SAMPLES)("would catch reaching other plugins or checking for a key in the app or a window with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(GLOBAL_APP_SAMPLES)("would catch reaching the app through a window or globalThis with %s, even in a file allowed to cast", (sample) => {
    expect(scan.breaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });

  it.each(CONSTRUCTOR_SAMPLES)("would catch reaching a constructor with %s", (sample) => {
    expect(scan.breaches(sample)).not.toEqual([]);
  });

  it.each(WIDENING_SAMPLES)("would catch reaching the vault through a value widened to hide it with %s, even in a file allowed to cast", (sample) => {
    expect(scan.breaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });

  it.each(HARMLESS_SAMPLES)("lets %s pass, since it reaches neither the vault nor an editor's text", (sample) => {
    expect(scan.breaches(sample)).toEqual([]);
  });
});
