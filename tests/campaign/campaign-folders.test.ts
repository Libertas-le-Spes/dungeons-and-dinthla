import { describe, expect, it } from "vitest";
import { campaignFolderOf, findCampaignFolders } from "../../src/campaign/campaign-folders";

describe("findCampaignFolders", () => {
  it("finds each top-level folder with a main note of its own name, in name order", () => {
    expect(
      findCampaignFolders([
        "Pale Moon/Pale Moon.md",
        "Pale Moon/Sessions/Session 1.md",
        "Ashen Road/Ashen Road.md",
        "Recipes/Bread.md",
        "Inbox.md",
        "Lore/Pale Moon/Pale Moon.md",
      ]),
    ).toEqual(["Ashen Road", "Pale Moon"]);
  });
});

describe("campaignFolderOf", () => {
  const folders = ["Ashen Road", "Pale Moon"];

  it("finds the campaign a note belongs to", () => {
    expect(campaignFolderOf("Pale Moon/Sessions/Session 1.md", folders)).toBe("Pale Moon");
  });

  it("finds no campaign for a note outside them", () => {
    expect(campaignFolderOf("Recipes/Bread.md", folders)).toBeNull();
    expect(campaignFolderOf("Inbox.md", folders)).toBeNull();
  });
});
