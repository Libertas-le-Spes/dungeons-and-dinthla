import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata } from "obsidian";
import { isDmCampaign } from "../../../src/references/asking/dm-campaign";

function campaignWith(cache: CachedMetadata | null) {
  return { metadata: { getCache: vi.fn(() => cache) }, campaignFolder: "D&D/Pale Moon" };
}

describe("isDmCampaign", () => {
  it("is true when the campaign's main note says role dm", () => {
    const campaign = campaignWith({ frontmatter: { role: "dm" } } as CachedMetadata);
    expect(isDmCampaign(campaign)).toBe(true);
    expect(campaign.metadata.getCache).toHaveBeenCalledWith("D&D/Pale Moon/Pale Moon.md");
  });

  it.each([["player"], ["researcher"], ["DM"], [["dm"]], [null]])("is false for the role %j", (role) => {
    expect(isDmCampaign(campaignWith({ frontmatter: { role } } as CachedMetadata))).toBe(false);
  });

  it("is false for a main note with no properties, or none read", () => {
    expect(isDmCampaign(campaignWith({}))).toBe(false);
    expect(isDmCampaign(campaignWith(null))).toBe(false);
  });
});
