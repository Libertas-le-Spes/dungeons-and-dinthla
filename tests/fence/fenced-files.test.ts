import { describe, expect, it, vi } from "vitest";
import type { EventRef, TAbstractFile } from "obsidian";
import { Fence, OUTSIDE_FENCE } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import { fileAt, folderAt, rawVaultWith } from "./fake-raw-vault";

const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const PRIVATE = fileAt("Private/Primary.md");
const BESIDE = fileAt("D&D Old/Secondary.md");

function filesWith(campaignsFolder: string | null = "D&D") {
  const empty = folderAt("D&D/Pale Moon/Items", []);
  const full = folderAt("D&D/Pale Moon/Sessions", [SESSION]);
  const outside = folderAt("Private", []);
  const campaigns = folderAt("D&D", []);
  const raw = rawVaultWith([SESSION, PRIVATE, BESIDE], [empty, full, outside, campaigns]);
  return { files: new FencedFiles(raw.vault, new Fence(() => campaignsFolder)), ...raw };
}

describe("FencedFiles lookups", () => {
  it("finds a file inside the Campaigns folder", () => {
    expect(filesWith().files.getFileByPath(SESSION.path)).toBe(SESSION);
  });

  it("finds nothing outside it, without asking the vault", () => {
    const { files, calls } = filesWith();
    expect(files.getFileByPath(PRIVATE.path)).toBeNull();
    expect(files.getFileByPath("D&D/../Private/Primary.md")).toBeNull();
    expect(calls.getFileByPath).not.toHaveBeenCalled();
  });

  it("finds nothing at all while no Campaigns folder is set", () => {
    const { files, calls } = filesWith(null);
    expect(files.getFileByPath(SESSION.path)).toBeNull();
    expect(files.getFiles()).toEqual([]);
    expect(calls.getFileByPath).not.toHaveBeenCalled();
  });

  it("finds a folder inside, and the Campaigns folder itself, but not one outside", () => {
    const { files, calls } = filesWith();
    expect(files.getFolderByPath("D&D/Pale Moon/Items")?.path).toBe("D&D/Pale Moon/Items");
    expect(files.getFolderByPath("D&D")?.path).toBe("D&D");
    expect(files.getFolderByPath("Private")).toBeNull();
    expect(calls.getFolderByPath).toHaveBeenCalledTimes(2);
  });

  it("lists only the files inside", () => {
    const { files } = filesWith();
    expect(files.getFiles()).toEqual([SESSION]);
    expect(files.getMarkdownFiles()).toEqual([SESSION]);
  });
});

describe("FencedFiles reads and writes", () => {
  it("reads a file inside", async () => {
    const { files } = filesWith();
    await expect(files.read(SESSION)).resolves.toBe(`read ${SESSION.path}`);
    await expect(files.cachedRead(SESSION)).resolves.toBe(`cached ${SESSION.path}`);
  });

  it("refuses to read a file outside", async () => {
    const { files, calls } = filesWith();
    await expect(files.read(PRIVATE)).rejects.toThrow(OUTSIDE_FENCE);
    await expect(files.cachedRead(BESIDE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(calls.read).not.toHaveBeenCalled();
    expect(calls.cachedRead).not.toHaveBeenCalled();
  });

  it("refuses a stand-in that only carries an inside path, not the vault's own file", async () => {
    const { files, calls } = filesWith();
    await expect(files.process(fileAt(SESSION.path), (text) => text)).rejects.toThrow(OUTSIDE_FENCE);
    expect(calls.process).not.toHaveBeenCalled();
  });

  it("changes a file inside", async () => {
    const { files } = filesWith();
    await expect(files.process(SESSION, (text) => `${text}!`)).resolves.toBe(`text of ${SESSION.path}!`);
  });

  it("refuses to change a file outside", async () => {
    const { files, calls } = filesWith();
    await expect(files.process(PRIVATE, (text) => text)).rejects.toThrow(OUTSIDE_FENCE);
    expect(calls.process).not.toHaveBeenCalled();
  });

  it("makes notes and folders inside", async () => {
    const { files, calls } = filesWith();
    await files.create("D&D/Pale Moon/Sessions/Session 2.md", "");
    await files.createFolder("D&D/Pale Moon/Characters");
    expect(calls.create).toHaveBeenCalledExactlyOnceWith("D&D/Pale Moon/Sessions/Session 2.md", "");
    expect(calls.createFolder).toHaveBeenCalledExactlyOnceWith("D&D/Pale Moon/Characters");
  });

  it("refuses to make anything outside, or on a path that climbs out", async () => {
    const { files, calls } = filesWith();
    await expect(files.create("Private/Secondary.md", "")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(files.create("D&D/../Private/Secondary.md", "")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(files.create("/D&D/Pale Moon/Notes.md", "")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(files.createFolder("Private/Secondary")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(files.createFolder("D&D")).rejects.toThrow(OUTSIDE_FENCE);
    expect(calls.create).not.toHaveBeenCalled();
    expect(calls.createFolder).not.toHaveBeenCalled();
  });

  it("refuses to make anything while no Campaigns folder is set", async () => {
    const { files, calls } = filesWith(null);
    await expect(files.create("D&D/Pale Moon/Pale Moon.md", "")).rejects.toThrow(OUTSIDE_FENCE);
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("removes an empty folder inside, and leaves one that holds something", async () => {
    const { files, calls } = filesWith();
    await files.removeEmptyFolder("D&D/Pale Moon/Items");
    await files.removeEmptyFolder("D&D/Pale Moon/Sessions");
    expect(calls.delete).toHaveBeenCalledOnce();
    expect(calls.delete.mock.calls[0]).toEqual([expect.objectContaining({ path: "D&D/Pale Moon/Items" })]);
  });

  it("refuses to remove a folder outside", async () => {
    const { files, calls } = filesWith();
    await expect(files.removeEmptyFolder("Private")).rejects.toThrow(OUTSIDE_FENCE);
    expect(calls.delete).not.toHaveBeenCalled();
  });

  it("gives the picture address of a file inside, and refuses one outside", () => {
    const { files, calls } = filesWith();
    expect(files.getResourcePath(SESSION)).toBe(`app://${SESSION.path}`);
    expect(() => files.getResourcePath(PRIVATE)).toThrow(OUTSIDE_FENCE);
    expect(calls.getResourcePath).toHaveBeenCalledOnce();
  });
});

describe("FencedFiles events", () => {
  it("passes on a file made, changed or deleted inside", () => {
    const { files, events } = filesWith();
    const heard = vi.fn();
    for (const name of ["create", "modify", "delete"] as const) files.on(name, heard);
    events.trigger("create", SESSION);
    events.trigger("modify", SESSION);
    events.trigger("delete", SESSION);
    expect(heard.mock.calls).toEqual([[SESSION, undefined], [SESSION, undefined], [SESSION, undefined]]);
  });

  it("drops a file made, changed or deleted outside", () => {
    const { files, events } = filesWith();
    const heard = vi.fn();
    for (const name of ["create", "modify", "delete"] as const) files.on(name, heard);
    events.trigger("create", PRIVATE);
    events.trigger("modify", BESIDE);
    events.trigger("delete", PRIVATE);
    expect(heard).not.toHaveBeenCalled();
  });

  it("passes on a rename into or out of the Campaigns folder, and drops one wholly outside", () => {
    const { files, events } = filesWith();
    const heard = vi.fn();
    files.on("rename", heard);
    events.trigger("rename", SESSION, "Private/Old.md");
    events.trigger("rename", PRIVATE, "D&D/Pale Moon/Old.md");
    events.trigger("rename", PRIVATE, "Private/Old.md");
    expect(heard.mock.calls).toEqual([
      [SESSION, "Private/Old.md"],
      [PRIVATE, "D&D/Pale Moon/Old.md"],
    ]);
  });

  it("drops an event that carries no file", () => {
    const { files, events } = filesWith();
    const heard = vi.fn();
    files.on("create", heard);
    events.trigger("create", null as unknown as TAbstractFile);
    expect(heard).not.toHaveBeenCalled();
  });

  it("stops listening when asked", () => {
    const { files, events } = filesWith();
    const ref = files.on("create", () => {});
    files.offref(ref);
    expect(events.stopped).toEqual([ref as EventRef]);
  });
});

