import { describe, expect, it } from "vitest";
import { settingsOf } from "../../src/settings/plugin-settings";

describe("settingsOf", () => {
  it("keeps the campaign chosen last time", () => {
    expect(settingsOf({ campaignFolder: "Pale Moon" })).toEqual({ campaignFolder: "Pale Moon", drafts: {} });
  });

  it("starts with no chosen campaign and no unsaved lines when nothing was saved", () => {
    expect(settingsOf(null)).toEqual({ campaignFolder: null, drafts: {} });
  });

  it("ignores saved data it can't read", () => {
    for (const saved of ["Pale Moon", 3, { campaignFolder: 3 }, {}, { drafts: "? Who" }, { drafts: null }]) {
      expect(settingsOf(saved)).toEqual({ campaignFolder: null, drafts: {} });
    }
  });

  it("keeps the lines typed but not saved, by session note, leaving out empty and unreadable ones", () => {
    const saved = { drafts: { "Pale Moon/Sessions/Session 3.md": "? Who", "Pale Moon/Sessions/Session 4.md": "", "Pale Moon/Sessions/Session 5.md": 5 } };
    expect(settingsOf(saved).drafts).toEqual({ "Pale Moon/Sessions/Session 3.md": "? Who" });
  });
});
