import { describe, expect, it, vi } from "vitest";
import { NOT_A_PLAIN_PATH, NOT_THE_WHOLE_VAULT } from "../../src/fence/campaigns-folder-path";
import { CampaignsFolderSetting } from "../../src/settings/campaigns-folder-setting";
import type { PluginSettings } from "../../src/settings/plugin-settings";
import { SettingsSaver } from "../../src/settings/settings-saver";

function settingFrom(campaignsFolder: string | null) {
  const settings: PluginSettings = { campaignsFolder, campaignFolder: null, welcomeSeen: true, lastVersionSeen: null };
  const order: string[] = [];
  const save = vi.fn(async (_written: PluginSettings) => {
    order.push("saved");
  });
  const moved = vi.fn(async () => {
    order.push("moved");
  });
  return { setting: new CampaignsFolderSetting(new SettingsSaver(settings, save), moved), settings, save, moved, order };
}

describe("CampaignsFolderSetting", () => {
  it("has no Campaigns folder until one is set", () => {
    expect(settingFrom(null).setting.path).toBeNull();
  });

  it("saves a newly chosen Campaigns folder, then says it moved", async () => {
    const { setting, save, order } = settingFrom(null);
    await setting.choose("Games/D&D");
    expect(setting.path).toBe("Games/D&D");
    expect(save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ campaignsFolder: "Games/D&D" }));
    expect(order).toEqual(["saved", "moved"]);
  });

  it("keeps the folder it had, and says nothing moved, when the new one can't be saved", async () => {
    const { setting, settings, save, moved } = settingFrom("D&D");
    save.mockRejectedValueOnce(new Error("data.json is read-only."));
    await expect(setting.choose("Games/D&D")).rejects.toThrow("data.json is read-only.");
    expect(setting.path).toBe("D&D");
    expect(settings.campaignsFolder).toBe("D&D");
    expect(moved).not.toHaveBeenCalled();
  });

  it("does nothing when the same folder is chosen again", async () => {
    const { setting, save, moved } = settingFrom("D&D");
    await setting.choose("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(moved).not.toHaveBeenCalled();
  });

  it("refuses the whole vault, and keeps the folder it had", async () => {
    const { setting, save, moved } = settingFrom("D&D");
    await expect(setting.choose("/")).rejects.toThrow(NOT_THE_WHOLE_VAULT);
    expect(setting.path).toBe("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(moved).not.toHaveBeenCalled();
  });

  it("refuses a path that steps out with ..", async () => {
    const { setting, save } = settingFrom(null);
    await expect(setting.choose("D&D/../Private")).rejects.toThrow(NOT_A_PLAIN_PATH);
    expect(setting.path).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });
});
