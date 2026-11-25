import { describe, expect, it, vi } from "vitest";
import { CampaignStore } from "../../src/campaign/reading/campaign-store";
import { CampaignFollowing } from "../../src/plugin/campaign-following";
import { SavedSettings } from "../../src/plugin/saved-settings";
import { InMemoryNotes } from "../host/in-memory-notes";
import { RecordedTelling } from "../host/showing/recorded-telling";
import { STUB_SYNTAX } from "../host/stub-syntax";

const PALE_MOON = "D&D/Pale Moon";
const ASHEN_ROAD = "D&D/Ashen Road";

async function following(saved: Record<string, unknown>, activePath: string | null = null) {
  const notes = new InMemoryNotes();
  notes.put(`${PALE_MOON}/Pale Moon.md`, "");
  notes.put(`${PALE_MOON}/Sessions/Session 1.md`, "? Who");
  notes.put(`${ASHEN_ROAD}/Ashen Road.md`, "");
  const store = new CampaignStore(notes, STUB_SYNTAX);
  const telling = new RecordedTelling();
  const data = { load: async () => saved, save: vi.fn(async () => {}) };
  const device = { load: () => undefined, save: () => {} };
  const settings = new SavedSettings({ data, device, settingsFolder: ".obsidian", telling }, store, async () => {});
  await settings.load();
  const showBackgrounds = vi.fn();
  const showCampaignTabsAgain = vi.fn();
  const follow = new CampaignFollowing({ notes, store, saved: settings, telling, activePath: () => activePath, showBackgrounds, showCampaignTabsAgain });
  return { follow, notes, store, settings, telling, data, showBackgrounds, showCampaignTabsAgain };
}

describe("CampaignFollowing", () => {
  it("finds the campaigns in the Campaigns folder", async () => {
    const { follow } = await following({ campaignsFolder: "D&D" });
    expect(follow.campaignFolders().sort()).toEqual([ASHEN_ROAD, PALE_MOON]);
  });

  it.each([
    { what: "the campaign chosen before", saved: { campaignsFolder: "D&D", campaignFolder: ASHEN_ROAD }, active: null, opened: ASHEN_ROAD },
    { what: "the campaign of the note open now", saved: { campaignsFolder: "D&D", campaignFolder: ASHEN_ROAD }, active: `${PALE_MOON}/Sessions/Session 1.md`, opened: PALE_MOON },
  ])("opens $what when it starts", async ({ saved, active, opened }) => {
    const { follow, store } = await following(saved, active);
    await follow.start();
    expect(store.campaignFolder).toBe(opened);
  });

  it("reads a session note again when the host has read it", async () => {
    const { follow, store, notes } = await following({ campaignsFolder: "D&D", campaignFolder: PALE_MOON });
    await follow.start();
    notes.texts.set(`${PALE_MOON}/Sessions/Session 1.md`, "! Ride");
    notes.readBack(notes.note(`${PALE_MOON}/Sessions/Session 1.md`)!);
    expect(store.current.quests).toHaveLength(1);
  });

  it("follows the open campaign when its folder is renamed, and keeps it chosen", async () => {
    const { follow, store, settings, notes } = await following({ campaignsFolder: "D&D", campaignFolder: PALE_MOON });
    await follow.start();
    notes.moveFolder(PALE_MOON, "D&D/Pale Moon Rising");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settings.chosen.folder).toBe("D&D/Pale Moon Rising");
    expect(store.campaignFolder).toBe("D&D/Pale Moon Rising");
  });

  it("switches to the campaign of a note opened in another one, and stays on the same one otherwise", async () => {
    const { follow, store } = await following({ campaignsFolder: "D&D", campaignFolder: PALE_MOON });
    await follow.start();
    await follow.followCampaignOf(`${ASHEN_ROAD}/Ashen Road.md`);
    expect(store.campaignFolder).toBe(ASHEN_ROAD);
    await follow.followCampaignOf("Elsewhere/Recipe.md");
    expect(store.campaignFolder).toBe(ASHEN_ROAD);
  });

  it("looks again: closes the campaign when none is left to open, and shows the backgrounds and tabs again", async () => {
    const { follow, store, showBackgrounds, showCampaignTabsAgain } = await following({});
    await follow.lookAgain();
    expect(store.campaignFolder).toBeNull();
    expect([showBackgrounds.mock.calls.length, showCampaignTabsAgain.mock.calls.length]).toEqual([1, 1]);
  });

  it("stops following notes once stopped", async () => {
    const { follow, store, notes } = await following({ campaignsFolder: "D&D", campaignFolder: PALE_MOON });
    await follow.start();
    follow.stop();
    notes.texts.set(`${PALE_MOON}/Sessions/Session 1.md`, "! Ride");
    notes.readBack(notes.note(`${PALE_MOON}/Sessions/Session 1.md`)!);
    expect(store.current.quests).toEqual([]);
  });
});
