import { describe, expect, it, vi } from "vitest";
import { Drafts } from "../../../src/session-notes/drafts/drafts";

const THREE = "Pale Moon/Sessions/Session 3.md";
const FOUR = "Pale Moon/Sessions/Session 4.md";

describe("Drafts", () => {
  it("keeps each session's box apart, and starts empty", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(THREE, "? Who");
    expect(drafts.textOf(THREE)).toBe("? Who");
    expect(drafts.textOf(FOUR)).toBe("");
  });

  it("follows a session note when it is renamed", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(THREE, "? Who");
    drafts.moved(THREE, FOUR);
    expect(drafts.textOf(FOUR)).toBe("? Who");
    expect(drafts.textOf(THREE)).toBe("");
  });

  it("leaves other drafts alone when a note without one is renamed", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(FOUR, "! Find it");
    drafts.moved(THREE, "Pale Moon/Sessions/Session 9.md");
    expect(drafts.textOf(FOUR)).toBe("! Find it");
    expect(drafts.textOf("Pale Moon/Sessions/Session 9.md")).toBe("");
  });

  it("forgets a box that was emptied", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(THREE, "? Who");
    drafts.keep(THREE, "");
    drafts.moved(THREE, FOUR);
    expect(drafts.textOf(FOUR)).toBe("");
  });

  it("starts with the lines kept from last time", () => {
    const drafts = new Drafts({ [THREE]: "? Who" }, () => {});
    expect(drafts.textOf(THREE)).toBe("? Who");
    expect(drafts.all()).toEqual({ [THREE]: "? Who" });
  });

  it("says when a box changes or follows a rename, and not when nothing changed", () => {
    const changed = vi.fn();
    const drafts = new Drafts({}, changed);
    drafts.keep(THREE, "? Who");
    drafts.keep(THREE, "? Who");
    drafts.moved(FOUR, THREE);
    expect(changed).toHaveBeenCalledOnce();
    drafts.moved(THREE, FOUR);
    drafts.keep(FOUR, "");
    expect(changed).toHaveBeenCalledTimes(3);
    expect(drafts.all()).toEqual({});
  });

  it("saves a session's box once at a time, keeping what the save leaves", async () => {
    const drafts = new Drafts({}, () => {});
    const told = vi.fn();
    drafts.keep(THREE, "? Who\n?? letter");
    drafts.subscribe(told);
    let finish = (_left: string) => {};
    const write = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)));
    const saving = drafts.save(THREE, write);
    expect(drafts.isSaving(THREE)).toBe(true);
    expect(drafts.isSaving(FOUR)).toBe(false);
    expect(told).toHaveBeenCalledExactlyOnceWith(THREE);
    expect(await drafts.save(THREE, write)).toBe(false);
    finish("?? letter");
    expect(await saving).toBe(true);
    expect(write).toHaveBeenCalledExactlyOnceWith(THREE, "? Who\n?? letter");
    expect(drafts.textOf(THREE)).toBe("?? letter");
    expect(drafts.isSaving(THREE)).toBe(false);
    expect(told).toHaveBeenCalledTimes(3);
  });

  it("keeps the box and lets it be saved again when a save fails", async () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(THREE, "? Who");
    await expect(drafts.save(THREE, async () => Promise.reject(new Error("gone")))).rejects.toThrow("gone");
    expect(drafts.textOf(THREE)).toBe("? Who");
    expect(drafts.isSaving(THREE)).toBe(false);
  });

  it("follows a rename made while saving, and keeps what is left under the new name", async () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(THREE, "? Who\n?? letter");
    let finish = (_left: string) => {};
    const saving = drafts.save(THREE, () => new Promise<string>((resolve) => (finish = resolve)));
    drafts.moved(THREE, FOUR);
    expect(drafts.isSaving(FOUR)).toBe(true);
    expect(drafts.isSaving(THREE)).toBe(false);
    finish("?? letter");
    await saving;
    expect(drafts.textOf(FOUR)).toBe("?? letter");
    expect(drafts.textOf(THREE)).toBe("");
    expect(drafts.isSaving(FOUR)).toBe(false);
  });

  it("stops telling a listener once it unsubscribes", async () => {
    const drafts = new Drafts({}, () => {});
    const told = vi.fn();
    const unsubscribe = drafts.subscribe(told);
    unsubscribe();
    drafts.keep(THREE, "? Who");
    await drafts.save(THREE, async () => "");
    expect(told).not.toHaveBeenCalled();
  });

  it("tells listeners when a box's text changes, and not when it stays the same", () => {
    const drafts = new Drafts({}, () => {});
    const told = vi.fn();
    drafts.subscribe(told);
    drafts.keep(THREE, "? Who");
    drafts.keep(THREE, "? Who");
    expect(told).toHaveBeenCalledExactlyOnceWith(THREE);
    drafts.keep(THREE, "");
    expect(told).toHaveBeenCalledTimes(2);
  });

  it("sets a box's text aside under another key, telling both, and leaves a key without text alone", () => {
    const changed = vi.fn();
    const drafts = new Drafts({ [THREE]: "? Who" }, changed);
    const told = vi.fn();
    drafts.subscribe(told);
    drafts.setAside(FOUR, "kept:4");
    expect(told).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    drafts.setAside(THREE, "kept:3");
    expect(drafts.textOf("kept:3")).toBe("? Who");
    expect(drafts.textOf(THREE)).toBe("");
    expect(drafts.keys()).toEqual(["kept:3"]);
    expect(changed).toHaveBeenCalledOnce();
    expect(told.mock.calls).toEqual([[THREE], ["kept:3"]]);
  });
});
