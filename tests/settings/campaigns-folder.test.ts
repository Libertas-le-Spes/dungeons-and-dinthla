import { describe, expect, it, vi } from "vitest";
import { NOT_A_PLAIN_PATH, NOT_THE_WHOLE_VAULT } from "../../src/fence/campaigns-folder-path";
import { CampaignsFolder } from "../../src/settings/campaigns-folder";
import type { PluginSettings } from "../../src/settings/plugin-settings";

function folderFrom(campaignsFolder: string | null) {
  const settings: PluginSettings = { campaignsFolder, campaignFolder: null, welcomeSeen: true, lastVersionSeen: null };
  const save = vi.fn(async () => {});
  const moved = vi.fn(async () => {});
  return { folder: new CampaignsFolder(settings, save, moved), settings, save, moved };
}

describe("CampaignsFolder", () => {
  it("has no Campaigns folder until one is set", () => {
    expect(folderFrom(null).folder.path).toBeNull();
  });

  it("saves a newly chosen Campaigns folder, then says it moved", async () => {
    const { folder, save, moved } = folderFrom(null);
    await folder.choose("Games/D&D");
    expect(folder.path).toBe("Games/D&D");
    expect(save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ campaignsFolder: "Games/D&D" }));
    expect(moved).toHaveBeenCalledOnce();
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(moved.mock.invocationCallOrder[0]!);
  });

  it("keeps the folder it had, and says nothing moved, when the new one can't be saved", async () => {
    const { folder, settings, save, moved } = folderFrom("D&D");
    save.mockRejectedValueOnce(new Error("data.json is read-only."));
    await expect(folder.choose("Games/D&D")).rejects.toThrow("data.json is read-only.");
    expect(folder.path).toBe("D&D");
    expect(settings.campaignsFolder).toBe("D&D");
    expect(moved).not.toHaveBeenCalled();
  });

  it("does nothing when the same folder is chosen again", async () => {
    const { folder, save, moved } = folderFrom("D&D");
    await folder.choose("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(moved).not.toHaveBeenCalled();
  });

  it("refuses the whole vault, and keeps the folder it had", async () => {
    const { folder, save, moved } = folderFrom("D&D");
    await expect(folder.choose("/")).rejects.toThrow(NOT_THE_WHOLE_VAULT);
    expect(folder.path).toBe("D&D");
    expect(save).not.toHaveBeenCalled();
    expect(moved).not.toHaveBeenCalled();
  });

  it("refuses a path that steps out with ..", async () => {
    const { folder, save } = folderFrom(null);
    await expect(folder.choose("D&D/../Private")).rejects.toThrow(NOT_A_PLAIN_PATH);
    expect(folder.path).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });
});
