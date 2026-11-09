import { describe, expect, it } from "vitest";
import { settingsOf } from "../../src/settings/plugin-settings";

const NOTHING_SAVED = { campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };

describe("settingsOf", () => {
  it("keeps the campaign chosen last time", () => {
    expect(settingsOf({ campaignFolder: "Pale Moon" })).toEqual({ ...NOTHING_SAVED, campaignFolder: "Pale Moon" });
  });

  it("starts with no chosen campaign, the welcome unseen and no version seen when nothing was saved", () => {
    expect(settingsOf(null)).toEqual(NOTHING_SAVED);
  });

  it("keeps that the welcome was seen and the last version whose news was seen", () => {
    expect(settingsOf({ campaignFolder: "Pale Moon", welcomeSeen: true, lastVersionSeen: "1.4.0" })).toEqual({
      campaignFolder: "Pale Moon",
      welcomeSeen: true,
      lastVersionSeen: "1.4.0",
    });
  });

  it("ignores saved data it can't read", () => {
    for (const saved of ["Pale Moon", 3, { campaignFolder: 3 }, { welcomeSeen: "yes", lastVersionSeen: 2 }, {}]) {
      expect(settingsOf(saved)).toEqual(NOTHING_SAVED);
    }
  });

  it("leaves unsaved lines out of the settings, since they are kept on this device only", () => {
    expect(settingsOf({ campaignFolder: "Pale Moon", drafts: { "Pale Moon/Sessions/Session 3.md": "? Who" } })).toEqual({
      ...NOTHING_SAVED,
      campaignFolder: "Pale Moon",
    });
  });
});
