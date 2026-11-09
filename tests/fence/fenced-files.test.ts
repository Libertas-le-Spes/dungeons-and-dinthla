import { describe, expect, it, vi } from "vitest";
import type { TAbstractFile } from "obsidian";
import { Fence, OUTSIDE_FENCE } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import { HeldFiles } from "../../src/fence/held-files";
import { fileAt, folderAt, rawVaultWith } from "./fake-raw-vault";

const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const PRIVATE = fileAt("Private/Primary.md");
const BESIDE = fileAt("D&D Old/Secondary.md");
const DECOMPOSED = fileAt("D&D/Zoe\u0308/Zoe\u0308.md");
const NO_BREAK = fileAt("D&D/Pale\u00a0Moon/Pale\u00a0Moon.md");

function filesWith(campaignsFolder: string | null = "D&D") {
  const empty = folderAt("D&D/Pale Moon/Items", []);
  const full = folderAt("D&D/Pale Moon/Sessions", [SESSION]);
  const outside = folderAt("Private", []);
  const campaigns = folderAt("D&D", [folderAt("D&D/Pale Moon", [empty, full])]);
  const raw = rawVaultWith([SESSION, PRIVATE, BESIDE, DECOMPOSED, NO_BREAK], [empty, full, outside, campaigns]);
  return { files: new FencedFiles(raw.vault, new HeldFiles(raw.vault, new Fence(() => campaignsFolder, ".obsidian"))), ...raw };
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

  it("names what is directly in a folder inside, or in the Campaigns folder itself, and nothing in a folder outside", () => {
    const { files, calls } = filesWith();
    expect(files.namesIn("D&D")).toEqual(["Pale Moon"]);
    expect(files.namesIn("D&D/Pale Moon/Sessions")).toEqual(["Session 1.md"]);
    expect(files.namesIn("Private")).toEqual([]);
    expect(calls.getFolderByPath).toHaveBeenCalledTimes(2);
  });

  it("lists the notes under a folder inside, and none in a folder whose name the fence refuses", () => {
    const lantern = fileAt("D&D/Pale Moon/Items/Silvered lantern.md");
    const refused = fileAt("D&D/Pale Moon/Items/Old./Lantern.md");
    const raw = rawVaultWith([SESSION, lantern, refused]);
    const files = new FencedFiles(raw.vault, new HeldFiles(raw.vault, new Fence(() => "D&D", ".obsidian")));
    expect(files.markdownFilesUnder("D&D/Pale Moon/Items")).toEqual([lantern]);
  });

  it("lists only the files inside", () => {
    const { files } = filesWith();
    expect(files.getFiles()).toEqual([SESSION, DECOMPOSED, NO_BREAK]);
    expect(files.getMarkdownFiles()).toEqual([SESSION, DECOMPOSED, NO_BREAK]);
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

  it("reads and changes a note the vault holds in decomposed letters or with a no-break space", async () => {
    const { files } = filesWith();
    expect(files.getFileByPath(DECOMPOSED.path)).toBe(DECOMPOSED);
    await expect(files.read(DECOMPOSED)).resolves.toBe(`read ${DECOMPOSED.path}`);
    await expect(files.process(NO_BREAK, (text) => `${text}!`)).resolves.toBe(`text of ${NO_BREAK.path}!`);
  });

  it("refuses to make a note on a path Obsidian would write another way", async () => {
    const { files, calls } = filesWith();
    await expect(files.create("D&D/Zoe\u0308/Sessions/Session 1.md", "")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(files.createFolder("D&D/Pale\u00a0Moon/Items")).rejects.toThrow(OUTSIDE_FENCE);
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

function listeningFiles() {
  const fenced = filesWith();
  fenced.files.load();
  return fenced;
}

describe("FencedFiles events", () => {
  it("passes on a file made, changed or deleted inside", () => {
    const { files, events } = listeningFiles();
    const made = vi.fn();
    const changed = vi.fn();
    const deleted = vi.fn();
    files.on("create", made);
    files.on("modify", changed);
    files.on("delete", deleted);
    events.trigger("create", SESSION);
    events.trigger("modify", SESSION);
    events.trigger("delete", SESSION);
    expect(made.mock.calls).toEqual([[SESSION]]);
    expect(changed.mock.calls).toEqual([[SESSION]]);
    expect(deleted.mock.calls).toEqual([[SESSION]]);
  });

  it("drops a file made, changed or deleted outside", () => {
    const { files, events } = listeningFiles();
    const heard = vi.fn();
    files.on("create", heard);
    files.on("modify", heard);
    files.on("delete", heard);
    events.trigger("create", PRIVATE);
    events.trigger("modify", BESIDE);
    events.trigger("delete", PRIVATE);
    expect(heard).not.toHaveBeenCalled();
  });

  it("passes on a rename inside, and one into the Campaigns folder, as a rename only", () => {
    const { files, events } = listeningFiles();
    const renamed = vi.fn();
    const deleted = vi.fn();
    files.on("rename", renamed);
    files.on("delete", deleted);
    events.trigger("rename", SESSION, "D&D/Pale Moon/Sessions/Session 0.md");
    events.trigger("rename", SESSION, "Private/Old.md");
    expect(renamed.mock.calls).toEqual([
      [SESSION, "D&D/Pale Moon/Sessions/Session 0.md"],
      [SESSION, "Private/Old.md"],
    ]);
    expect(deleted).not.toHaveBeenCalled();
  });

  it("passes on a rename out of the Campaigns folder as a delete of the old path, never carrying the outside path in", () => {
    const { files, events } = listeningFiles();
    const renamed = vi.fn();
    const deleted = vi.fn();
    files.on("rename", renamed);
    files.on("delete", deleted);
    events.trigger("rename", fileAt("Self/Pale Moon"), "D&D/Pale Moon");
    expect(renamed).not.toHaveBeenCalled();
    expect(deleted.mock.calls).toEqual([[{ path: "D&D/Pale Moon" }]]);
  });

  it("drops a rename wholly outside", () => {
    const { files, events } = listeningFiles();
    const heard = vi.fn();
    files.on("rename", heard);
    files.on("delete", heard);
    events.trigger("rename", PRIVATE, "Private/Old.md");
    expect(heard).not.toHaveBeenCalled();
  });

  it("drops an event that carries no file", () => {
    const { files, events } = listeningFiles();
    const heard = vi.fn();
    files.on("create", heard);
    events.trigger("create", null as unknown as TAbstractFile);
    expect(heard).not.toHaveBeenCalled();
  });

  it("hears nothing from the vault until it is loaded", () => {
    const { files, events } = filesWith();
    const heard = vi.fn();
    files.on("create", heard);
    events.trigger("create", SESSION);
    expect(heard).not.toHaveBeenCalled();
  });

  it("stops passing on to a listener taken off", () => {
    const { files, events } = listeningFiles();
    const heard = vi.fn();
    const ref = files.on("create", heard);
    files.offref(ref);
    events.trigger("create", SESSION);
    expect(heard).not.toHaveBeenCalled();
  });

  it("stops listening to the vault when unloaded", () => {
    const { files, events } = listeningFiles();
    files.unload();
    expect(events.stopped).toHaveLength(4);
  });
});
