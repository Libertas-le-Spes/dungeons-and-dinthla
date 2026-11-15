import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TFolder } from "obsidian";
import { CampaignMaker } from "../../../src/campaign/writing/campaign-maker";
import type { NewCampaignFiles } from "../../../src/campaign/writing/make-campaign";
import { Notice } from "../../stubs/obsidian";

function filesWith(inCampaigns: string[]): NewCampaignFiles {
  return {
    namesIn: () => inCampaigns,
    createFolder: vi.fn(async () => ({}) as TFolder),
    create: vi.fn(async () => ({}) as never),
    removeEmptyFolder: vi.fn(async () => {}),
  };
}

const IN_D_AND_D = () => "D&D";

describe("CampaignMaker", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("moves into the campaign it made, under the name Obsidian gave it", async () => {
    const choose = vi.fn(async () => {});
    await new CampaignMaker(filesWith([]), IN_D_AND_D, choose).make(" Silver\u00a0Road ");
    expect(choose).toHaveBeenCalledExactlyOnceWith("D&D/Silver Road");
    expect(Notice.shown).toEqual([]);
  });

  it("says why when the campaign can't be made, and moves nowhere", async () => {
    const choose = vi.fn(async () => {});
    await new CampaignMaker(filesWith(["Silver Road"]), IN_D_AND_D, choose).make("Silver Road");
    expect(choose).not.toHaveBeenCalled();
    expect(Notice.shown).toHaveLength(1);
    expect(Notice.shown[0]).toMatch(/^Couldn't make the campaign: There is already a folder or file called Silver Road/);
  });

  it("says the campaign was made but not moved into when choosing it fails", async () => {
    const choose = vi.fn(async () => {
      throw new Error("data.json is read-only.");
    });
    await new CampaignMaker(filesWith([]), IN_D_AND_D, choose).make("Silver Road");
    expect(Notice.shown).toEqual(["Made D&D/Silver Road, but couldn't move into it: data.json is read-only."]);
  });

  it("says whether the campaign was made", async () => {
    const choose = vi.fn(async () => {});
    await expect(new CampaignMaker(filesWith([]), IN_D_AND_D, choose).make("Silver Road")).resolves.toBe(true);
    await expect(new CampaignMaker(filesWith(["Silver Road"]), IN_D_AND_D, choose).make("Silver Road")).resolves.toBe(false);
  });

  it("counts a campaign as made when it was made but couldn't be moved into", async () => {
    const choose = vi.fn(async () => {
      throw new Error("data.json is read-only.");
    });
    await expect(new CampaignMaker(filesWith([]), IN_D_AND_D, choose).make("Silver Road")).resolves.toBe(true);
  });
});
