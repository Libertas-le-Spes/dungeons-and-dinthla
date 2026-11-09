import { describe, expect, it } from "vitest";
import { ChosenCampaign } from "../../src/settings/chosen-campaign";
import type { PluginSettings } from "../../src/settings/plugin-settings";

function chosenFrom(campaignFolder: string | null) {
  const saved: (string | null)[] = [];
  const opened: string[] = [];
  const chosen = new ChosenCampaign(
    { campaignFolder, welcomeSeen: true, lastVersionSeen: null },
    async (settings: PluginSettings) => {
      saved.push(settings.campaignFolder);
    },
    async (folder: string) => {
      opened.push(folder);
    },
  );
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

  it("opens the campaign already chosen without saving it again", async () => {
    const { chosen, saved, opened } = chosenFrom("Pale Moon");
    await chosen.choose("Pale Moon");
    expect(saved).toEqual([]);
    expect(opened).toEqual(["Pale Moon"]);
  });

  it("follows the chosen campaign's folder when it is renamed", async () => {
    const { chosen, saved } = chosenFrom("Pale Moon");
    await chosen.renamed("Curse of the Pale Moon", "Pale Moon");
    expect(chosen.folder).toBe("Curse of the Pale Moon");
    expect(saved).toEqual(["Curse of the Pale Moon"]);
  });

  it("keeps its choice when something else is renamed", async () => {
    const { chosen, saved } = chosenFrom("Pale Moon");
    await chosen.renamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 1.md");
    expect(chosen.folder).toBe("Pale Moon");
    expect(saved).toEqual([]);
  });
});
