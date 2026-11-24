import { describe, expect, it, vi } from "vitest";
import { isDmCampaign } from "../../../src/references/asking/dm-campaign";
import { fileAt } from "../../stubs/note-files";

const MAIN = "D&D/Pale Moon/Pale Moon.md";

function campaignWith(properties: Record<string, unknown> | null, main = fileAt(MAIN)) {
  const notes = { store: { note: vi.fn(() => main) }, facts: { propertiesOf: vi.fn(() => properties) } };
  return { notes, campaignFolder: "D&D/Pale Moon" };
}

describe("isDmCampaign", () => {
  it("is true when the campaign's main note says role dm", () => {
    const main = fileAt(MAIN);
    const campaign = campaignWith({ role: "dm" }, main);
    expect(isDmCampaign(campaign)).toBe(true);
    expect(campaign.notes.store.note).toHaveBeenCalledWith(MAIN);
    expect(campaign.notes.facts.propertiesOf).toHaveBeenCalledWith(main);
  });

  it.each([["player"], ["researcher"], ["DM"], [["dm"]], [null]])("is false for the role %j", (role) => {
    expect(isDmCampaign(campaignWith({ role }))).toBe(false);
  });

  it("is false for a main note with no properties, or none read", () => {
    expect(isDmCampaign(campaignWith({}))).toBe(false);
    expect(isDmCampaign(campaignWith(null))).toBe(false);
  });

  it("is false when the campaign has no main note, and reads no properties", () => {
    const campaign = { notes: { store: { note: vi.fn(() => null) }, facts: { propertiesOf: vi.fn(() => ({ role: "dm" })) } }, campaignFolder: "D&D/Pale Moon" };
    expect(isDmCampaign(campaign)).toBe(false);
    expect(campaign.notes.facts.propertiesOf).not.toHaveBeenCalled();
  });
});
