import { describe, expect, it } from "vitest";
import { ChosenCampaign } from "../../src/settings/chosen-campaign";
import type { PluginSettings } from "../../src/settings/plugin-settings";
import { SettingsSaver } from "../../src/settings/settings-saver";

function oneTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function chosenFrom(campaignFolder: string | null, saveFails = false) {
  const saved: (string | null)[] = [];
  const opened: string[] = [];
  const saver = new SettingsSaver({ campaignsFolder: null, campaignFolder, welcomeSeen: true, lastVersionSeen: null }, async (settings: PluginSettings) => {
    await oneTick();
    if (saveFails) throw new Error("data.json is read-only.");
    saved.push(settings.campaignFolder);
  });
  const chosen = new ChosenCampaign(saver, async (folder: string) => {
    await oneTick();
    opened.push(folder);
  });
  return { chosen, saved, opened };
}

describe("ChosenCampaign", () => {
  it("saves and opens a newly chosen campaign", async () => {
    const { chosen, saved, opened } = chosenFrom("Ashen Road");
    await chosen.choose("Pale Moon");
    expect(chosen.folder).toBe("Pale Moon");
    expect(saved).toEqual(["Pale Moon"]);
    expect(opened).toEqual(["Pale Moon"]);
  });

  it("keeps the campaign it had, and opens nothing, when the new choice can't be saved", async () => {
    const { chosen, opened } = chosenFrom("Ashen Road", true);
    await expect(chosen.choose("Pale Moon")).rejects.toThrow("data.json is read-only.");
    expect(chosen.folder).toBe("Ashen Road");
    expect(opened).toEqual([]);
  });

  it("keeps the folder it had when the renamed folder can't be saved", async () => {
    const { chosen } = chosenFrom("Pale Moon", true);
    await expect(chosen.renamed("Curse of the Pale Moon", "Pale Moon")).rejects.toThrow("data.json is read-only.");
    expect(chosen.folder).toBe("Pale Moon");
  });

  it("opens the campaign already chosen without saving it again", async () => {
    const { chosen, saved, opened } = chosenFrom("Pale Moon");
    await chosen.choose("Pale Moon");
    expect(saved).toEqual([]);
    expect(opened).toEqual(["Pale Moon"]);
  });

  it("ends on the last campaign chosen when it is picked again before the one before it is saved", async () => {
    const { chosen, saved, opened } = chosenFrom("Ashen Road");
    await Promise.all([chosen.choose("Pale Moon"), chosen.choose("Ashen Road")]);
    expect(chosen.folder).toBe("Ashen Road");
    expect(saved).toEqual(["Pale Moon", "Ashen Road"]);
    expect(opened).toEqual(["Ashen Road"]);
  });

  it("follows the chosen campaign's folder when it is renamed", async () => {
    const { chosen, saved } = chosenFrom("Pale Moon");
    await chosen.renamed("Curse of the Pale Moon", "Pale Moon");
    expect(chosen.folder).toBe("Curse of the Pale Moon");
    expect(saved).toEqual(["Curse of the Pale Moon"]);
  });

  it("follows a rename of the campaign being chosen while its save is still waiting", async () => {
    const { chosen, saved } = chosenFrom("Ashen Road");
    await Promise.all([chosen.choose("Pale Moon"), chosen.renamed("Curse of the Pale Moon", "Pale Moon")]);
    expect(chosen.folder).toBe("Curse of the Pale Moon");
    expect(saved).toEqual(["Pale Moon", "Curse of the Pale Moon"]);
  });

  it("keeps its choice when something else is renamed", async () => {
    const { chosen, saved } = chosenFrom("Pale Moon");
    await chosen.renamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 1.md");
    expect(chosen.folder).toBe("Pale Moon");
    expect(saved).toEqual([]);
  });
});
