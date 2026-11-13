import { describe, expect, it, vi } from "vitest";
import { MOVED_KEY, OldDrafts } from "../../../src/settings/drafts/old-drafts";

const THREE = "Pale Moon/Sessions/Session 3.md";
const FOUR = "Pale Moon/Sessions/Session 4.md";
const SETTINGS = { campaignsFolder: null, campaignFolder: "Pale Moon", welcomeSeen: true, lastVersionSeen: "1.0.0", notesMadeFor: [] };

function storageWith(moved: unknown) {
  return { load: vi.fn(() => moved), save: vi.fn() };
}

describe("OldDrafts", () => {
  it("reads the lines the earlier build kept in the settings file, leaving out what isn't text", () => {
    const old = new OldDrafts({ campaignsFolder: null, campaignFolder: "Pale Moon", drafts: { [THREE]: "? Old", [FOUR]: "! Find it", "x.md": 5 } }, storageWith(null));
    expect(old.waiting).toBe(true);
    expect(old.texts).toEqual({ [THREE]: "? Old", [FOUR]: "! Find it" });
  });

  it("keeps them in the settings file until they are kept on the device, then marks them moved", () => {
    const storage = storageWith(null);
    const old = new OldDrafts({ campaignsFolder: null, campaignFolder: "Pale Moon", drafts: { [THREE]: "? Who" } }, storage);
    expect(old.dataOf(SETTINGS)).toEqual({ ...SETTINGS, drafts: { [THREE]: "? Who" } });
    expect(old.leftInFile).toBe(false);
    old.keptOnDevice();
    expect(storage.save).toHaveBeenCalledExactlyOnceWith(MOVED_KEY, true);
    expect(old.waiting).toBe(false);
    expect(old.dataOf(SETTINGS)).toEqual(SETTINGS);
    expect(old.leftInFile).toBe(true);
    old.fileRewritten();
    expect(old.leftInFile).toBe(false);
  });

  it("moves them only once, even if the settings file still holds them", () => {
    const storage = storageWith(true);
    const old = new OldDrafts({ drafts: { [THREE]: "? Who" } }, storage);
    expect(storage.load).toHaveBeenCalledExactlyOnceWith(MOVED_KEY);
    expect(old.waiting).toBe(false);
    expect(old.texts).toEqual({});
    expect(old.leftInFile).toBe(true);
    old.keptOnDevice();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("has nothing to move, and doesn't read the device, when the settings file holds no drafts", () => {
    const storage = storageWith(null);
    for (const saved of [null, "Pale Moon", { campaignsFolder: null, campaignFolder: "Pale Moon" }]) {
      const old = new OldDrafts(saved, storage);
      expect(old.waiting).toBe(false);
      expect(old.leftInFile).toBe(false);
    }
    expect(storage.load).not.toHaveBeenCalled();
  });
});
