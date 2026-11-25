import { describe, expect, it, vi } from "vitest";
import { ObsidianCampaignsFolderPlace } from "../../../src/obsidian/host/obsidian-campaigns-folder-place";

describe("ObsidianCampaignsFolderPlace", () => {
  it("offers the folders the gate's chooser offers", () => {
    const choices = { folderPaths: vi.fn(() => ["D&D", "Games"]), make: vi.fn() };
    expect(new ObsidianCampaignsFolderPlace(choices).folderPaths()).toEqual(["D&D", "Games"]);
    expect(choices.folderPaths).toHaveBeenCalledOnce();
  });

  it("makes the folder through the gate's chooser, and hands back the path it made", async () => {
    const choices = { folderPaths: vi.fn(), make: vi.fn(async () => "Games/D&D") };
    await expect(new ObsidianCampaignsFolderPlace(choices).make("Games/D&D ")).resolves.toBe("Games/D&D");
    expect(choices.make).toHaveBeenCalledExactlyOnceWith("Games/D&D ");
  });

  it("passes on the chooser's refusal", async () => {
    const choices = { folderPaths: vi.fn(), make: vi.fn(async () => Promise.reject(new Error("Not the config folder."))) };
    await expect(new ObsidianCampaignsFolderPlace(choices).make(".obsidian")).rejects.toThrow("Not the config folder.");
  });
});
