import { describe, expect, it } from "vitest";
import { settingsOf } from "../../src/settings/plugin-settings";

const NOTHING_SAVED = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };

describe("settingsOf", () => {
  it("keeps the campaign chosen last time", () => {
    expect(settingsOf({ campaignsFolder: "D&D", campaignFolder: "D&D/Pale Moon" })).toEqual({
      ...NOTHING_SAVED,
      campaignsFolder: "D&D",
      campaignFolder: "D&D/Pale Moon",
    });
  });

  it("drops a saved campaign outside the Campaigns folder, or one that climbs out of it", () => {
    for (const campaignFolder of ["Self/Pale Moon", "D&D Old/Pale Moon", "D&D", "D&D/../Self/Pale Moon", "/D&D/Pale Moon"]) {
      expect(settingsOf({ campaignsFolder: "D&D", campaignFolder })).toEqual({ ...NOTHING_SAVED, campaignsFolder: "D&D" });
    }
  });

  it("drops a saved campaign while no Campaigns folder is set", () => {
    expect(settingsOf({ campaignFolder: "D&D/Pale Moon" })).toEqual(NOTHING_SAVED);
  });

  it("starts with no chosen campaign, the welcome unseen and no version seen when nothing was saved", () => {
    expect(settingsOf(null)).toEqual(NOTHING_SAVED);
  });

  it("keeps that the welcome was seen and the last version whose news was seen", () => {
    expect(settingsOf({ welcomeSeen: true, lastVersionSeen: "1.4.0" })).toEqual({
      campaignsFolder: null,
      campaignFolder: null,
      welcomeSeen: true,
      lastVersionSeen: "1.4.0",
    });
  });

  it("keeps the Campaigns folder set last time, at any depth", () => {
    expect(settingsOf({ campaignsFolder: "Games/D&D" })).toEqual({ ...NOTHING_SAVED, campaignsFolder: "Games/D&D" });
  });

  it("keeps a Campaigns folder the vault holds in decomposed letters or with a no-break space", () => {
    for (const campaignsFolder of ["Zoe\u0308", "Pale\u00a0Moon"]) expect(settingsOf({ campaignsFolder })).toEqual({ ...NOTHING_SAVED, campaignsFolder });
  });

  it("drops a saved Campaigns folder that is the whole vault, not a plain path or hidden, so the plugin touches nothing", () => {
    for (const campaignsFolder of ["/", "", "../D&D", "/D&D", "D&D/../Private", ".obsidian", "Games/.hidden", 3]) {
      expect(settingsOf({ campaignsFolder })).toEqual(NOTHING_SAVED);
    }
  });

  it("ignores saved data it can't read", () => {
    for (const saved of ["Pale Moon", 3, { campaignFolder: 3 }, { welcomeSeen: "yes", lastVersionSeen: 2 }, {}]) {
      expect(settingsOf(saved)).toEqual(NOTHING_SAVED);
    }
  });

  it("leaves unsaved lines out of the settings, since they are kept on this device only", () => {
    expect(settingsOf({ campaignsFolder: "D&D", drafts: { "D&D/Pale Moon/Sessions/Session 3.md": "? Who" } })).toEqual({
      ...NOTHING_SAVED,
      campaignsFolder: "D&D",
    });
  });
});
