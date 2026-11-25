import { describe, expect, it, vi } from "vitest";
import { startPlugin, type PluginHost } from "../../src/plugin/start-plugin";
import { InMemoryNotes } from "../host/in-memory-notes";
import { RecordedTelling } from "../host/showing/recorded-telling";
import { STUB_SPELLING } from "../host/stub-spelling";
import { STUB_SYNTAX } from "../host/stub-syntax";

const SESSION = "D&D/Pale Moon/Sessions/Session 1.md";
const OUTSIDE = "Recipes/Bread.md";

function nothing(): void {}

function hostWith(saved: unknown) {
  const notes = new InMemoryNotes();
  notes.put("D&D/Pale Moon/Pale Moon.md", "");
  notes.put(SESSION, "? Who rang the bell");
  notes.put(OUTSIDE, "Flour, water.");
  const data = { load: async () => saved, save: vi.fn(async () => {}) };
  const device = { load: () => undefined, save: vi.fn() };
  const host: PluginHost = {
    notes,
    written: { listen: () => nothing },
    report: { textSaved: nothing, trashed: nothing, renamed: nothing },
    spelling: STUB_SPELLING,
    syntax: STUB_SYNTAX,
    settingsFolder: ".obsidian",
    data,
    device,
    clock: { now: () => 1_000 },
    timer: { start: () => 1, stop: nothing },
    closing: { onUnload: nothing, onQuit: nothing, onVisibilityChange: nothing, onPageHide: nothing, pageHidden: () => false },
    telling: new RecordedTelling(),
    dialogs: { open: vi.fn() },
  };
  return { host, notes, data };
}

const SHOWING = { activePath: () => null, showBackgrounds: nothing, showCampaignTabsAgain: nothing };

describe("startPlugin", () => {
  it("fences the host's notes to the saved Campaigns folder", async () => {
    const { host } = hostWith({ campaignsFolder: "D&D" });
    const plugin = startPlugin(host, SHOWING);
    await plugin.load();
    expect(plugin.notes.store.note(SESSION)).not.toBeNull();
    expect(plugin.notes.store.note(OUTSIDE)).toBeNull();
  });

  it("fences every note away while no Campaigns folder is saved", async () => {
    const { host } = hostWith({});
    const plugin = startPlugin(host, SHOWING);
    await plugin.load();
    expect(plugin.notes.store.note(SESSION)).toBeNull();
  });

  it("opens the chosen campaign and reads its sessions when the campaign starts", async () => {
    const { host } = hostWith({ campaignsFolder: "D&D", campaignFolder: "D&D/Pale Moon" });
    const plugin = startPlugin(host, SHOWING);
    await plugin.load();
    await plugin.startCampaign();
    expect(plugin.store.campaignFolder).toBe("D&D/Pale Moon");
    expect(plugin.store.current.questions).toHaveLength(1);
  });

  it("keeps the D&D Beyond answer in the plugin's settings", async () => {
    const { host, data } = hostWith({ campaignsFolder: "D&D" });
    const plugin = startPlugin(host, SHOWING);
    await plugin.load();
    await plugin.agreement.give();
    expect(data.save).toHaveBeenLastCalledWith(expect.objectContaining({ beyondAgreed: true }));
  });

  it("stops following notes once stopped", async () => {
    const { host, notes } = hostWith({ campaignsFolder: "D&D", campaignFolder: "D&D/Pale Moon" });
    const plugin = startPlugin(host, SHOWING);
    await plugin.load();
    plugin.keepDrafts();
    await plugin.startCampaign();
    plugin.stop();
    notes.texts.set(SESSION, "? Who rang the bell\n? Who lit the lamp");
    notes.readBack(notes.note(SESSION)!);
    expect(plugin.store.current.questions).toHaveLength(1);
  });
});
