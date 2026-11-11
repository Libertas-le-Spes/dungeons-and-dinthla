import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_A_PLAIN_PATH, NOT_THE_CONFIG_FOLDER, NOT_THE_WHOLE_VAULT } from "../../../src/fence/paths/campaigns-folder-path";
import { CampaignsFolderSetting } from "../../../src/settings/saved/campaigns-folder-setting";
import type { PluginSettings } from "../../../src/settings/saved/plugin-settings";
import { SettingsSaver } from "../../../src/settings/saved/settings-saver";
import { Notice } from "../../stubs/obsidian";

function oneTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function settingFrom(campaignsFolder: string | null, configDir = ".obsidian") {
  const settings: PluginSettings = { campaignsFolder, campaignFolder: null, welcomeSeen: true, lastVersionSeen: null };
  const order: string[] = [];
  const save = vi.fn(async (written: PluginSettings) => {
    await oneTick();
    order.push(`saved ${written.campaignsFolder}`);
  });
  const lookedIn: (string | null)[] = [];
  const saver = new SettingsSaver(settings, save);
  const changed = vi.fn(async () => {
    lookedIn.push(saver.settings.campaignsFolder);
    await oneTick();
    order.push("looked again");
  });
  return { setting: new CampaignsFolderSetting(saver, changed, configDir), settings, save, changed, order, lookedIn };
}

describe("CampaignsFolderSetting", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("has no Campaigns folder until one is set", () => {
    expect(settingFrom(null).setting.path).toBeNull();
  });

  it("saves a newly chosen Campaigns folder, then looks again", async () => {
    const { setting, save, order } = settingFrom(null);
    await setting.choose("Games/D&D");
    expect(setting.path).toBe("Games/D&D");
    expect(save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ campaignsFolder: "Games/D&D" }));
    expect(order).toEqual(["saved Games/D&D", "looked again"]);
  });

  it("keeps the folder it had, and doesn't look again, when the new one can't be saved", async () => {
    const { setting, settings, save, changed } = settingFrom("D&D");
    save.mockRejectedValueOnce(new Error("data.json is read-only."));
    await expect(setting.choose("Games/D&D")).rejects.toThrow("data.json is read-only.");
    expect(setting.path).toBe("D&D");
    expect(settings.campaignsFolder).toBe("D&D");
    expect(changed).not.toHaveBeenCalled();
  });

  it("does nothing when the same folder is chosen again", async () => {
    const { setting, save, changed } = settingFrom("D&D");
    await setting.choose("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("ends on the last folder chosen when the old one is picked again before the new one is saved", async () => {
    const { setting, order, lookedIn } = settingFrom("D&D");
    await Promise.all([setting.choose("Games/D&D"), setting.choose("D&D")]);
    expect(setting.path).toBe("D&D");
    expect(order).toEqual(["saved Games/D&D", "saved D&D", "looked again"]);
    expect(lookedIn).toEqual(["D&D"]);
  });

  it("still looks again when a folder is chosen twice while the first choice is being saved", async () => {
    const { setting, order, lookedIn } = settingFrom("D&D");
    await Promise.all([setting.choose("Games/D&D"), setting.choose("Games/D&D")]);
    expect(order).toEqual(["saved Games/D&D", "looked again"]);
    expect(lookedIn).toEqual(["Games/D&D"]);
  });

  it("looks again once when the same folder is chosen twice, one after the other", async () => {
    const { setting, changed } = settingFrom("D&D");
    await setting.choose("Games/D&D");
    await setting.choose("Games/D&D");
    expect(changed).toHaveBeenCalledOnce();
  });

  it("looks again in the folder an earlier choice saved when the last choice can't be saved", async () => {
    const { setting, save, order, lookedIn } = settingFrom("D&D");
    save.mockImplementation(async (written: PluginSettings) => {
      await oneTick();
      if (written.campaignsFolder === "Old Games") throw new Error("The disk is full.");
      order.push(`saved ${written.campaignsFolder}`);
    });
    const [first, last] = await Promise.allSettled([setting.choose("Games/D&D"), setting.choose("Old Games")]);
    expect(first.status).toBe("fulfilled");
    expect(last).toEqual({ status: "rejected", reason: new Error("The disk is full.") });
    expect(setting.path).toBe("Games/D&D");
    expect(order).toEqual(["saved Games/D&D", "looked again"]);
    expect(lookedIn).toEqual(["Games/D&D"]);
  });

  it("looks again only in the last folder chosen when a choice between can't be saved", async () => {
    const { setting, save, lookedIn } = settingFrom("D&D");
    save.mockImplementation(async (written: PluginSettings) => {
      await oneTick();
      if (written.campaignsFolder === "Old Games") throw new Error("The disk is full.");
    });
    const results = await Promise.allSettled([setting.choose("Games/D&D"), setting.choose("Old Games"), setting.choose("New Games")]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    expect(lookedIn).toEqual(["New Games"]);
  });

  it("waits for the look again before it is done", async () => {
    const { setting, changed } = settingFrom("D&D");
    let finishLooking: () => void = () => {};
    changed.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishLooking = resolve;
        }),
    );
    let done = false;
    const choosing = setting.choose("Games/D&D").then(() => {
      done = true;
    });
    await vi.waitFor(() => expect(changed).toHaveBeenCalledOnce());
    await oneTick();
    expect(done).toBe(false);
    finishLooking();
    await choosing;
    expect(done).toBe(true);
  });

  it("keeps the folder it saved, and says so plainly, when opening a campaign in it fails", async () => {
    const { setting, changed } = settingFrom("D&D");
    changed.mockRejectedValueOnce(new Error("The note can't be read."));
    await setting.choose("Games/D&D");
    expect(setting.path).toBe("Games/D&D");
    expect(Notice.shown).toEqual(["Set the Campaigns folder to Games/D&D, but couldn't open a campaign in it: The note can't be read."]);
  });

  it("refuses the whole vault, and keeps the folder it had", async () => {
    const { setting, save, changed } = settingFrom("D&D");
    await expect(setting.choose("/")).rejects.toThrow(NOT_THE_WHOLE_VAULT);
    expect(setting.path).toBe("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("refuses a path that steps out with ..", async () => {
    const { setting, save } = settingFrom(null);
    await expect(setting.choose("D&D/../Private")).rejects.toThrow(NOT_A_PLAIN_PATH);
    expect(setting.path).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it("refuses the vault's settings folder and the folders inside it, even when its name has no dot", async () => {
    const { setting, save, changed } = settingFrom("D&D", "Vault Settings");
    for (const path of ["Vault Settings", "Vault Settings/D&D"]) await expect(setting.choose(path)).rejects.toThrow(NOT_THE_CONFIG_FOLDER);
    expect(setting.path).toBe("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });
});
