import { describe, expect, it } from "vitest";
import { campaignFolderOf, campaignNotePathOf, findCampaignFolders, isSessionNote } from "../../src/campaign/campaign-folders";

describe("campaignNotePathOf", () => {
  it("gives the main note of the campaign folder a note is in", () => {
    expect(campaignNotePathOf("Pale Moon/Characters/Mira.md")).toBe("Pale Moon/Pale Moon.md");
  });

  it("gives none for a note outside any folder", () => {
    expect(campaignNotePathOf("Mira.md")).toBeNull();
  });
});

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

describe("isSessionNote", () => {
  const exists = (path: string) => path === "Pale Moon/Pale Moon.md";

  it("knows a session note of a campaign", () => {
    expect(isSessionNote("Pale Moon/Sessions/Session 3.md", exists)).toBe(true);
  });

  it("leaves out other notes, and sessions of a folder that isn't a campaign", () => {
    for (const path of ["Pale Moon/Characters/Mira.md", "Recipes/Sessions/Session 1.md", "Session 1.md"]) {
      expect(isSessionNote(path, exists)).toBe(false);
    }
  });
});
