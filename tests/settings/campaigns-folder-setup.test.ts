import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignsFolderSetup } from "../../src/settings/campaigns-folder-setup";
import { Notice } from "../stubs/obsidian";

function setupWith({ chooseFails = false, makeFails = false } = {}) {
  const folder = {
    path: null as string | null,
    choose: vi.fn(async (path: string) => {
      if (chooseFails) throw new Error("data.json is read-only.");
      folder.path = path;
    }),
  };
  const folders = {
    folderPaths: vi.fn(() => ["D&D", "Recipes"]),
    make: vi.fn(async (typed: string) => {
      if (makeFails) throw new Error("A file already has that name.");
      return typed.trim();
    }),
  };
  let picked: (folder: string) => void = () => {};
  const pickFolder = vi.fn((_folders: string[], chosen: (folder: string) => void) => {
    picked = chosen;
  });
  const setup = new CampaignsFolderSetup(folder, folders, pickFolder);
  return { setup, folder, folders, pickFolder, pick: (path: string) => picked(path) };
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("CampaignsFolderSetup", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("offers every folder, sets the one picked, then says it is chosen", async () => {
    const { setup, folder, pickFolder, pick } = setupWith();
    const chosen = vi.fn();
    setup.pick(chosen);
    expect(pickFolder).toHaveBeenCalledExactlyOnceWith(["D&D", "Recipes"], expect.any(Function));
    expect(chosen).not.toHaveBeenCalled();
    pick("D&D");
    await settled();
    expect(folder.choose).toHaveBeenCalledExactlyOnceWith("D&D");
    expect(setup.path).toBe("D&D");
    expect(chosen).toHaveBeenCalledOnce();
  });

  it("says why when the folder picked can't be set", async () => {
    const { setup, pick } = setupWith({ chooseFails: true });
    const chosen = vi.fn();
    setup.pick(chosen);
    pick("D&D");
    await settled();
    expect(Notice.shown).toEqual(["Couldn't set the Campaigns folder: data.json is read-only."]);
    expect(chosen).not.toHaveBeenCalled();
  });

  it("makes the folder named, then sets it", async () => {
    const { setup, folder, folders } = setupWith();
    await setup.make(" Games/D&D ");
    expect(folders.make).toHaveBeenCalledExactlyOnceWith(" Games/D&D ");
    expect(folder.choose).toHaveBeenCalledExactlyOnceWith("Games/D&D");
  });

  it("sets nothing when the folder can't be made", async () => {
    const { setup, folder } = setupWith({ makeFails: true });
    await expect(setup.make("D&D")).rejects.toThrow("A file already has that name.");
    expect(folder.choose).not.toHaveBeenCalled();
  });
});
