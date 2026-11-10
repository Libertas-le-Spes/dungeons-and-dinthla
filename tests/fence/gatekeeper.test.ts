import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { OUTSIDE_FENCE } from "../../src/fence/fence";
import { Gatekeeper } from "../../src/fence/gatekeeper";
import { fileAt, rawVaultWith } from "./fake-raw-vault";

const MAIN_NOTE = fileAt("D&D/Pale Moon/Pale Moon.md");
const PRIVATE = fileAt("Private/Primary.md");

function appWith() {
  const { vault, calls } = rawVaultWith([MAIN_NOTE, PRIVATE]);
  const fileManager = { processFrontMatter: vi.fn(async () => {}), renameFile: vi.fn(), trashFile: vi.fn() };
  const metadataCache = { getCache: vi.fn(() => null) };
  const app = { vault, fileManager, metadataCache } as unknown as App;
  return { app, calls, fileManager, metadataCache };
}

describe("Gatekeeper", () => {
  it("fences every part it hands out inside the Campaigns folder it is given", async () => {
    const { app, calls, fileManager, metadataCache } = appWith();
    let folder: string | null = "D&D";
    const gate = new Gatekeeper(app, () => folder);
    expect(gate.files.getFiles()).toEqual([MAIN_NOTE]);
    await gate.fileActions.processFrontMatter(MAIN_NOTE, () => {});
    gate.metadata.getCache(MAIN_NOTE.path);
    folder = null;
    expect(gate.files.getFiles()).toEqual([]);
    await expect(gate.fileActions.processFrontMatter(MAIN_NOTE, () => {})).rejects.toThrow(OUTSIDE_FENCE);
    expect(gate.metadata.getCache(MAIN_NOTE.path)).toBeNull();
    expect(gate.fence.holds(MAIN_NOTE.path)).toBe(false);
    expect(calls.getFiles).toHaveBeenCalledTimes(2);
    expect(fileManager.processFrontMatter).toHaveBeenCalledOnce();
    expect(metadataCache.getCache).toHaveBeenCalledOnce();
  });

  it("refuses everything outside the Campaigns folder", async () => {
    const { app, fileManager } = appWith();
    const gate = new Gatekeeper(app, () => "D&D");
    expect(gate.files.getFileByPath(PRIVATE.path)).toBeNull();
    await expect(gate.fileActions.trashFile(PRIVATE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(fileManager.trashFile).not.toHaveBeenCalled();
  });

  it("hands out the vault's settings folder by the name the vault gives it", () => {
    const { vault } = rawVaultWith([]);
    const app = { vault: { ...vault, configDir: "Vault Settings" }, fileManager: {}, metadataCache: {} } as unknown as App;
    expect(new Gatekeeper(app, () => "D&D").configDir).toBe("Vault Settings");
  });

  it("fences nothing in when the Campaigns folder is inside the vault's settings folder", () => {
    const { vault } = rawVaultWith([fileAt("Vault Settings/D&D/Pale Moon.md")]);
    const app = { vault: { ...vault, configDir: "Vault Settings" }, fileManager: {}, metadataCache: {} } as unknown as App;
    const gate = new Gatekeeper(app, () => "Vault Settings/D&D");
    expect(gate.fence.holds("Vault Settings/D&D/Pale Moon.md")).toBe(false);
    expect(gate.files.getFiles()).toEqual([]);
  });
});
