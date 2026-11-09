import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TFolder } from "obsidian";
import { CampaignMaker } from "../../src/campaign/campaign-maker";
import type { NewCampaignVault } from "../../src/campaign/make-campaign";
import { Notice } from "../stubs/obsidian";

function vaultWith(topLevel: string[]): NewCampaignVault {
  return {
    getRoot: () => ({ children: topLevel.map((name) => ({ name })) }) as unknown as TFolder,
    getFolderByPath: () => null,
    createFolder: vi.fn(async () => ({}) as TFolder),
    create: vi.fn(async () => ({}) as never),
    delete: vi.fn(async () => {}),
  };
}

describe("CampaignMaker", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("moves into the campaign it made, under the name Obsidian gave it", async () => {
    const choose = vi.fn(async () => {});
    await new CampaignMaker(vaultWith([]), choose).make(" Silver\u00a0Road ");
    expect(choose).toHaveBeenCalledExactlyOnceWith("Silver Road");
    expect(Notice.shown).toEqual([]);
  });

  it("says why when the campaign can't be made, and moves nowhere", async () => {
    const choose = vi.fn(async () => {});
    await new CampaignMaker(vaultWith(["Silver Road"]), choose).make("Silver Road");
    expect(choose).not.toHaveBeenCalled();
    expect(Notice.shown).toHaveLength(1);
    expect(Notice.shown[0]).toMatch(/^Couldn't make the campaign: There is already a folder or file called Silver Road/);
  });

  it("says the campaign was made but not moved into when choosing it fails", async () => {
    const choose = vi.fn(async () => {
      throw new Error("data.json is read-only.");
    });
    await new CampaignMaker(vaultWith([]), choose).make("Silver Road");
    expect(Notice.shown).toEqual(["Made Silver Road, but couldn't move into it: data.json is read-only."]);
  });
});
