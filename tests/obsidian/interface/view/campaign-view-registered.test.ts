import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { isCampaignViewRegistered } from "../../../../src/obsidian/interface/view/campaign-view-registered";
import { CAMPAIGN_VIEW } from "../../../../src/obsidian/interface/view/campaign-view";

function appWithCreator(creator: unknown) {
  const getViewCreatorByType = vi.fn(() => creator);
  return { app: { viewRegistry: { getViewCreatorByType } } as unknown as App, getViewCreatorByType };
}

describe("isCampaignViewRegistered", () => {
  it("is true when Obsidian can make the campaign tab", () => {
    const { app, getViewCreatorByType } = appWithCreator(() => ({}));
    expect(isCampaignViewRegistered(app)).toBe(true);
    expect(getViewCreatorByType).toHaveBeenCalledExactlyOnceWith(CAMPAIGN_VIEW);
  });

  it("is false when the campaign tab was never registered", () => {
    const { app } = appWithCreator(undefined);
    expect(isCampaignViewRegistered(app)).toBe(false);
  });

  it("is false when Obsidian has no view registry to ask", () => {
    expect(isCampaignViewRegistered({} as App)).toBe(false);
  });
});
