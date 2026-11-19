import { describe, expect, it } from "vitest";
import { settingsOf } from "../../../src/settings/saved/plugin-settings";

const CONFIG_DIR = ".obsidian";

const NOTHING_SAVED = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null, notesMadeFor: [], beyondAgreed: false, charactersBasesSwept: false };

describe("settingsOf", () => {
  it("keeps the campaign chosen last time", () => {
    expect(settingsOf({ campaignsFolder: "D&D", campaignFolder: "D&D/Pale Moon" }, CONFIG_DIR)).toEqual({
      ...NOTHING_SAVED,
      campaignsFolder: "D&D",
      campaignFolder: "D&D/Pale Moon",
    });
  });

  it("drops a saved campaign outside the Campaigns folder, or one that climbs out of it", () => {
    for (const campaignFolder of ["Self/Pale Moon", "D&D Old/Pale Moon", "D&D", "D&D/../Self/Pale Moon", "/D&D/Pale Moon"]) {
      expect(settingsOf({ campaignsFolder: "D&D", campaignFolder }, CONFIG_DIR)).toEqual({ ...NOTHING_SAVED, campaignsFolder: "D&D" });
    }
  });

  it("drops a saved campaign while no Campaigns folder is set", () => {
    expect(settingsOf({ campaignFolder: "D&D/Pale Moon" }, CONFIG_DIR)).toEqual(NOTHING_SAVED);
  });

  it("starts with no chosen campaign, the welcome unseen and no version seen when nothing was saved", () => {
    expect(settingsOf(null, CONFIG_DIR)).toEqual(NOTHING_SAVED);
  });

  it("keeps that the welcome was seen and the last version whose news was seen", () => {
    expect(settingsOf({ welcomeSeen: true, lastVersionSeen: "1.4.0" }, CONFIG_DIR)).toEqual({
      campaignsFolder: null,
      campaignFolder: null,
      welcomeSeen: true,
      lastVersionSeen: "1.4.0",
      notesMadeFor: [],
      beyondAgreed: false,
      charactersBasesSwept: false,
    });
  });

  it("keeps that the old Characters bases were dealt with only when data.json holds true for it", () => {
    expect(settingsOf({ charactersBasesSwept: true }, CONFIG_DIR).charactersBasesSwept).toBe(true);
    expect(settingsOf({ charactersBasesSwept: "true" }, CONFIG_DIR).charactersBasesSwept).toBe(false);
  });

  it("keeps the D&D Beyond agreement only when data.json holds true for it", () => {
    expect(settingsOf({ beyondAgreed: true }, CONFIG_DIR).beyondAgreed).toBe(true);
  });

  it.each([["true"], [1], [null], [{}]])("takes no D&D Beyond agreement from %j", (saved) => {
    expect(settingsOf({ beyondAgreed: saved }, CONFIG_DIR).beyondAgreed).toBe(false);
  });

  it("keeps the Campaigns folder set last time, at any depth", () => {
    expect(settingsOf({ campaignsFolder: "Games/D&D" }, CONFIG_DIR)).toEqual({ ...NOTHING_SAVED, campaignsFolder: "Games/D&D" });
  });

  it("keeps a Campaigns folder the vault holds in decomposed letters or with a no-break space", () => {
    for (const campaignsFolder of ["Zoe\u0308", "Pale\u00a0Moon"]) expect(settingsOf({ campaignsFolder }, CONFIG_DIR)).toEqual({ ...NOTHING_SAVED, campaignsFolder });
  });

  it("drops a saved Campaigns folder that is the whole vault, not a plain path or hidden, so the plugin touches nothing", () => {
    for (const campaignsFolder of ["/", "", "../D&D", "/D&D", "D&D/../Private", ".obsidian", "Games/.hidden", 3]) {
      expect(settingsOf({ campaignsFolder }, CONFIG_DIR)).toEqual(NOTHING_SAVED);
    }
  });

  it("drops a saved Campaigns folder that is the vault's settings folder or inside it, even when its name has no dot", () => {
    for (const campaignsFolder of ["Vault Settings", "Vault Settings/D&D"]) {
      expect(settingsOf({ campaignsFolder }, "Vault Settings")).toEqual(NOTHING_SAVED);
    }
  });

  it("keeps a saved Campaigns folder whose name only starts like the vault's settings folder", () => {
    expect(settingsOf({ campaignsFolder: "Vault Settings Old" }, "Vault Settings")).toEqual({ ...NOTHING_SAVED, campaignsFolder: "Vault Settings Old" });
  });

  it("ignores saved data it can't read", () => {
    for (const saved of ["Pale Moon", 3, { campaignFolder: 3 }, { welcomeSeen: "yes", lastVersionSeen: 2 }, {}]) {
      expect(settingsOf(saved, CONFIG_DIR)).toEqual(NOTHING_SAVED);
    }
  });

  it("leaves unsaved lines out of the settings, since they are kept on this device only", () => {
    expect(settingsOf({ campaignsFolder: "D&D", drafts: { "D&D/Pale Moon/Sessions/Session 3.md": "? Who" } }, CONFIG_DIR)).toEqual({
      ...NOTHING_SAVED,
      campaignsFolder: "D&D",
    });
  });
});

describe("settingsOf notes made for", () => {
  it("keeps the campaigns whose old sessions got their notes", () => {
    const saved = { campaignsFolder: "D&D", notesMadeFor: ["D&D/Pale Moon", "D&D/Silver Road"], beyondAgreed: false, charactersBasesSwept: false };
    expect(settingsOf(saved, CONFIG_DIR).notesMadeFor).toEqual(["D&D/Pale Moon", "D&D/Silver Road"]);
  });

  it("drops a saved campaign outside the Campaigns folder, or one that isn't a text", () => {
    const saved = { campaignsFolder: "D&D", notesMadeFor: ["Self/Pale Moon", "D&D/../Self/Pale Moon", 4, "D&D/Pale Moon"], beyondAgreed: false, charactersBasesSwept: false };
    expect(settingsOf(saved, CONFIG_DIR).notesMadeFor).toEqual(["D&D/Pale Moon"]);
  });

  it("starts with none when what was saved isn't a list", () => {
    for (const notesMadeFor of ["D&D/Pale Moon", 4, null, { "D&D/Pale Moon": true }]) {
      expect(settingsOf({ campaignsFolder: "D&D", notesMadeFor }, CONFIG_DIR).notesMadeFor).toEqual([]);
    }
  });
});
