import { describe, expect, it } from "vitest";
import type { TAbstractFile } from "obsidian";
import { BAD_NAME } from "../../src/campaign/file-name";
import { makeCampaign, NO_CAMPAIGN_NAME, type NewCampaignVault } from "../../src/campaign/make-campaign";

function vaultWith(taken: string[]) {
  const made: string[] = [];
  const vault: NewCampaignVault = {
    getAbstractFileByPath: (path) => {
      if (!taken.includes(path)) return null;
      return { path } as TAbstractFile;
    },
    createFolder: async (path) => {
      made.push(`folder ${path}`);
      return { path } as never;
    },
    create: async (path, text) => {
      made.push(`note ${path} "${text}"`);
      return { path } as never;
    },
  };
  return { vault, made };
}

describe("makeCampaign", () => {
  it("makes a top-level folder and an empty main note of the same name, and gives back the folder", async () => {
    const { vault, made } = vaultWith([]);
    await expect(makeCampaign(vault, "Silver Road")).resolves.toBe("Silver Road");
    expect(made).toEqual(["folder Silver Road", 'note Silver Road/Silver Road.md ""']);
  });

  it("leaves out the spaces typed around the name", async () => {
    const { vault, made } = vaultWith([]);
    await expect(makeCampaign(vault, "  Silver Road ")).resolves.toBe("Silver Road");
    expect(made).toEqual(["folder Silver Road", 'note Silver Road/Silver Road.md ""']);
  });

  it("asks for a name when none is typed, and makes nothing", async () => {
    const { vault, made } = vaultWith([]);
    await expect(makeCampaign(vault, "   ")).rejects.toThrow(NO_CAMPAIGN_NAME);
    expect(made).toEqual([]);
  });

  it("refuses a name a file can't have, and makes nothing", async () => {
    const { vault, made } = vaultWith([]);
    await expect(makeCampaign(vault, "Silver/Road")).rejects.toThrow(BAD_NAME);
    expect(made).toEqual([]);
  });

  it("refuses a name already used at the top of the vault, and says how to make that folder a campaign", async () => {
    const { vault, made } = vaultWith(["Silver Road"]);
    await expect(makeCampaign(vault, "Silver Road")).rejects.toThrow("add a note called Silver Road inside it");
    expect(made).toEqual([]);
  });
});
