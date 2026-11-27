import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignsFolderSetting } from "../../../src/settings/saved/campaigns-folder-setting";
import { CampaignsFolderSetup } from "../../../src/settings/choosing/campaigns-folder-setup";
import { SettingsSaver } from "../../../src/settings/saved/settings-saver";
import { Notice } from "../../stubs/obsidian";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";

function setupWith({ chooseFails = false, makeFails = false } = {}) {
  const setting = {
    path: null as string | null,
    choose: vi.fn(async (path: string) => {
      if (chooseFails) throw new Error("data.json is read-only.");
      setting.path = path;
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
  const setup = new CampaignsFolderSetup(setting, folders, pickFolder, OBSIDIAN_TELLING);
  return { setup, setting, folders, pickFolder, pick: (path: string) => picked(path) };
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("CampaignsFolderSetup", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("offers every folder, sets the one picked, then says it is chosen", async () => {
    const { setup, setting, pickFolder, pick } = setupWith();
    const chosen = vi.fn();
    setup.pick(chosen);
    expect(pickFolder).toHaveBeenCalledExactlyOnceWith(["D&D", "Recipes"], expect.any(Function));
    expect(chosen).not.toHaveBeenCalled();
    pick("D&D");
    await settled();
    expect(setting.choose).toHaveBeenCalledExactlyOnceWith("D&D");
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
    const { setup, setting, folders } = setupWith();
    await setup.make(" Games/D&D ");
    expect(folders.make).toHaveBeenCalledExactlyOnceWith(" Games/D&D ");
    expect(setting.choose).toHaveBeenCalledExactlyOnceWith("Games/D&D");
  });

  it("sets nothing when the folder can't be made", async () => {
    const { setup, setting } = setupWith({ makeFails: true });
    await expect(setup.make("D&D")).rejects.toThrow("A file already has that name.");
    expect(setting.choose).not.toHaveBeenCalled();
  });

  it("says the folder was set, and still says it is chosen, when opening a campaign in it fails", async () => {
    const saver = new SettingsSaver({ campaignsFolder: null, campaignFolder: null, welcomeSeen: true, lastVersionSeen: null, notesMadeFor: [], beyondAgreed: false, charactersBasesSwept: false, carryingNoticeShown: false }, async () => {});
    const setting = new CampaignsFolderSetting(saver, async () => {
      throw new Error("The note can't be read.");
    }, ".obsidian", OBSIDIAN_TELLING);
    let picked: (folder: string) => void = () => {};
    const setup = new CampaignsFolderSetup(setting, { folderPaths: () => ["D&D"], make: async (typed: string) => typed }, (_folders, chosen) => {
      picked = chosen;
    }, OBSIDIAN_TELLING);
    const chosen = vi.fn();
    setup.pick(chosen);
    picked("D&D");
    await settled();
    expect(saver.settings.campaignsFolder).toBe("D&D");
    expect(chosen).toHaveBeenCalledOnce();
    expect(Notice.shown).toEqual(["Set the Campaigns folder to D&D, but couldn't open a campaign in it: The note can't be read."]);
  });

  it("makes the folder without failing when opening a campaign in it fails", async () => {
    const saver = new SettingsSaver({ campaignsFolder: null, campaignFolder: null, welcomeSeen: true, lastVersionSeen: null, notesMadeFor: [], beyondAgreed: false, charactersBasesSwept: false, carryingNoticeShown: false }, async () => {});
    const setting = new CampaignsFolderSetting(saver, async () => {
      throw new Error("The note can't be read.");
    }, ".obsidian", OBSIDIAN_TELLING);
    const setup = new CampaignsFolderSetup(setting, { folderPaths: () => [], make: async (typed: string) => typed }, () => {}, OBSIDIAN_TELLING);
    await setup.make("D&D");
    expect(saver.settings.campaignsFolder).toBe("D&D");
    expect(Notice.shown).toEqual(["Set the Campaigns folder to D&D, but couldn't open a campaign in it: The note can't be read."]);
  });
});
