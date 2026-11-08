import { describe, expect, it } from "vitest";
import { settingsOf } from "../../src/settings/plugin-settings";

describe("settingsOf", () => {
  it("keeps the campaign chosen last time", () => {
    expect(settingsOf({ campaignFolder: "Pale Moon" })).toEqual({ campaignFolder: "Pale Moon" });
  });

  it("starts with no chosen campaign when nothing was saved", () => {
    expect(settingsOf(null)).toEqual({ campaignFolder: null });
  });

  it("ignores saved data it can't read", () => {
    for (const saved of ["Pale Moon", 3, { campaignFolder: 3 }, {}]) expect(settingsOf(saved)).toEqual({ campaignFolder: null });
  });
});
