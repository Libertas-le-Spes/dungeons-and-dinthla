import { describe, expect, it } from "vitest";
import { CompressedEntry } from "../../../../src/pdf/xref/entries/compressed-entry";
import { FreeEntry } from "../../../../src/pdf/xref/entries/free-entry";
import { InFileEntry } from "../../../../src/pdf/xref/entries/in-file-entry";
import type { XrefEntry } from "../../../../src/pdf/xref/entries/xref-entry";
import { RecordingLoading } from "../../support/recording-loading";
import { refusalFrom } from "../../support/parsed";

describe("InFileEntry", () => {
  it("accepts only its own generation", () => {
    const entry = new InFileEntry(90, 2);
    expect(entry.acceptsGeneration(2)).toBe(true);
    expect(entry.acceptsGeneration(0)).toBe(false);
  });

  it("loads from its offset with its generation, and is no container", () => {
    const loading = new RecordingLoading();
    const entry = new InFileEntry(90, 2);
    entry.load(loading, 5);
    expect(loading.offsets).toEqual([90]);
    expect(loading.generations).toEqual([2]);
    expect(entry.containerNumber()).toBeNull();
  });
});

describe("CompressedEntry", () => {
  it("accepts only generation zero", () => {
    const entry = new CompressedEntry(30, 4);
    expect(entry.acceptsGeneration(0)).toBe(true);
    expect(entry.acceptsGeneration(1)).toBe(false);
  });

  it("loads from its container at its index, and names its container", () => {
    const loading = new RecordingLoading();
    const entry = new CompressedEntry(30, 4);
    entry.load(loading, 5);
    expect(loading.containers).toEqual([30]);
    expect(loading.indexes).toEqual([4]);
    expect(entry.containerNumber()).toBe(30);
  });
});

describe("FreeEntry", () => {
  it("accepts no generation and refuses to load", () => {
    const entry: XrefEntry = new FreeEntry();
    expect(entry.acceptsGeneration(0)).toBe(false);
    expect(refusalFrom(() => entry.load(new RecordingLoading(), 5))).toContain("an object it says was deleted");
    expect(entry.containerNumber()).toBeNull();
  });
});
