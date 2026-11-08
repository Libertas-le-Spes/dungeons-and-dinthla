import { describe, expect, it } from "vitest";
import {
  campaignFolderOf,
  campaignNotePathOf,
  chosenCampaignFolder,
  findCampaignFolders,
  isSessionNote,
  mainNotePathOf,
  startingCampaignFolder,
} from "../../src/campaign/campaign-folders";

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

describe("mainNotePathOf", () => {
  it("names the note at the top of the folder after the folder", () => {
    expect(mainNotePathOf("Pale Moon")).toBe("Pale Moon/Pale Moon.md");
  });
});

describe("chosenCampaignFolder", () => {
  const folders = ["Ashen Road", "Pale Moon"];

  it("keeps the chosen campaign", () => {
    expect(chosenCampaignFolder("Pale Moon", folders)).toBe("Pale Moon");
  });

  it("takes the first campaign when none was chosen, or the chosen one is gone", () => {
    expect(chosenCampaignFolder(null, folders)).toBe("Ashen Road");
    expect(chosenCampaignFolder("Lost Mines", folders)).toBe("Ashen Road");
  });

  it("has no campaign when the vault has none", () => {
    expect(chosenCampaignFolder("Pale Moon", [])).toBeNull();
  });
});

describe("startingCampaignFolder", () => {
  const folders = ["Ashen Road", "Pale Moon", "Silver Coast"];

  it("starts in the campaign of the open note", () => {
    expect(startingCampaignFolder("Silver Coast/Sessions/Session 1.md", "Pale Moon", folders)).toBe("Silver Coast");
  });

  it("starts in the chosen campaign when no note is open, or the open note is outside every campaign", () => {
    expect(startingCampaignFolder(null, "Pale Moon", folders)).toBe("Pale Moon");
    expect(startingCampaignFolder("Recipes/Bread.md", "Pale Moon", folders)).toBe("Pale Moon");
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
