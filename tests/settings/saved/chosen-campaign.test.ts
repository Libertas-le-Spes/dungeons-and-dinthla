import { describe, expect, it } from "vitest";
import { ChosenCampaign } from "../../../src/settings/saved/chosen-campaign";
import type { PluginSettings } from "../../../src/settings/saved/plugin-settings";
import { SettingsSaver } from "../../../src/settings/saved/settings-saver";
import { queuedWorkRan } from "../../stubs/queued-work";

function chosenFrom(campaignFolder: string | null, saveFails = false, savesThatFail: string[] = []) {
  const saved: (string | null)[] = [];
  const opened: string[] = [];
  const saver = new SettingsSaver({ campaignsFolder: null, campaignFolder, welcomeSeen: true, lastVersionSeen: null, notesMadeFor: [] }, async (settings: PluginSettings) => {
    await queuedWorkRan();
    if (saveFails) throw new Error("data.json is read-only.");
    if (settings.campaignFolder !== null && savesThatFail.includes(settings.campaignFolder)) throw new Error("The disk is full.");
    saved.push(settings.campaignFolder);
  });
  const campaign = {
    campaignFolder,
    async open(folder: string) {
      await queuedWorkRan();
      opened.push(folder);
      campaign.campaignFolder = folder;
    },
  };
  const chosen = new ChosenCampaign(saver, campaign);
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

  it("follows, and opens, a rename of the campaign being chosen while its save is still waiting", async () => {
    const { chosen, saved, opened } = chosenFrom("Ashen Road");
    await Promise.all([chosen.choose("Pale Moon"), chosen.renamed("Curse of the Pale Moon", "Pale Moon")]);
    expect(chosen.folder).toBe("Curse of the Pale Moon");
    expect(saved).toEqual(["Pale Moon", "Curse of the Pale Moon"]);
    expect(opened).toEqual(["Curse of the Pale Moon"]);
  });

  it("opens the campaign an earlier choice saved when the last choice can't be saved", async () => {
    const { chosen, saved, opened } = chosenFrom("Ashen Road", false, ["Gilded Stag"]);
    const [first, last] = await Promise.allSettled([chosen.choose("Pale Moon"), chosen.choose("Gilded Stag")]);
    expect(first.status).toBe("fulfilled");
    expect(last).toEqual({ status: "rejected", reason: new Error("The disk is full.") });
    expect(chosen.folder).toBe("Pale Moon");
    expect(saved).toEqual(["Pale Moon"]);
    expect(opened).toEqual(["Pale Moon"]);
  });

  it("opens only the last choice when a choice between can't be saved", async () => {
    const { chosen, saved, opened } = chosenFrom("Ashen Road", false, ["Gilded Stag"]);
    const results = await Promise.allSettled([chosen.choose("Pale Moon"), chosen.choose("Gilded Stag"), chosen.choose("Old Mill")]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    expect(saved).toEqual(["Pale Moon", "Old Mill"]);
    expect(opened).toEqual(["Old Mill"]);
  });

  it("opens nothing when the last choice can't be saved and no campaign was saved before it", async () => {
    const { chosen, opened } = chosenFrom(null, true);
    await expect(chosen.choose("Pale Moon")).rejects.toThrow("data.json is read-only.");
    expect(chosen.folder).toBeNull();
    expect(opened).toEqual([]);
  });

  it("keeps its choice when something else is renamed", async () => {
    const { chosen, saved } = chosenFrom("Pale Moon");
    await chosen.renamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 1.md");
    expect(chosen.folder).toBe("Pale Moon");
    expect(saved).toEqual([]);
  });
});
