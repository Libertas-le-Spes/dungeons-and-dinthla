import { describe, expect, it } from "vitest";
import {
  campaignFolderOf,
  campaignNotePathOf,
  chosenCampaignFolder,
  findCampaignFolders,
  isMainNote,
  isSessionNote,
  mainNotePathOf,
  charactersBasePathOf,
  charactersFolderOf,
  campaignOfCharacter,
  campaignOfItem,
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

describe("charactersFolderOf", () => {
  it("is the Characters folder at the campaign's top", () => {
    expect(charactersFolderOf("Pale Moon")).toBe("Pale Moon/Characters");
  });
});

describe("charactersBasePathOf", () => {
  it("is the Characters base at the campaign's top", () => {
    expect(charactersBasePathOf("Pale Moon")).toBe("Pale Moon/Characters.base");
  });
});

describe("campaignOfCharacter", () => {
  const folders = ["Ashen Road", "Pale Moon"];

  it("is the campaign of a Markdown note in its Characters folder, or a folder inside it", () => {
    expect(campaignOfCharacter("Pale Moon/Characters/Mira.md", folders)).toBe("Pale Moon");
    expect(campaignOfCharacter("Ashen Road/Characters/Villains/Lady Vess.md", folders)).toBe("Ashen Road");
  });

  it("is nothing for another file in the Characters folder", () => {
    expect(campaignOfCharacter("Pale Moon/Characters/Mira.png", folders)).toBeNull();
  });

  it("is nothing for a note elsewhere in the campaign, or in a folder only named like Characters", () => {
    expect(campaignOfCharacter("Pale Moon/Sessions/Session 1.md", folders)).toBeNull();
    expect(campaignOfCharacter("Pale Moon/Characters.md", folders)).toBeNull();
    expect(campaignOfCharacter("Pale Moon/Characters.base", folders)).toBeNull();
    expect(campaignOfCharacter("Pale Moon/Characters old/Mira.md", folders)).toBeNull();
  });

  it("is nothing for a Characters folder of a folder that isn't a campaign", () => {
    expect(campaignOfCharacter("Gilded Stag/Characters/Mira.md", folders)).toBeNull();
  });
});

describe("campaignOfItem", () => {
  const folders = ["Ashen Road", "Pale Moon"];

  it("is the campaign of a Markdown note in its Items folder, or a folder inside it", () => {
    expect(campaignOfItem("Pale Moon/Items/Silvered lantern.md", folders)).toBe("Pale Moon");
    expect(campaignOfItem("Ashen Road/Items/Potions/Potion of healing.md", folders)).toBe("Ashen Road");
  });

  it("is nothing for another file in the Items folder, a note elsewhere, or a folder only named like Items", () => {
    expect(campaignOfItem("Pale Moon/Items/Silvered lantern.png", folders)).toBeNull();
    expect(campaignOfItem("Pale Moon/Places/Old Mill.md", folders)).toBeNull();
    expect(campaignOfItem("Pale Moon/Items.md", folders)).toBeNull();
    expect(campaignOfItem("Pale Moon/Items old/Silvered lantern.md", folders)).toBeNull();
  });

  it("is nothing for an Items folder of a folder that isn't a campaign", () => {
    expect(campaignOfItem("Gilded Stag/Items/Silvered lantern.md", folders)).toBeNull();
  });
});

describe("isMainNote", () => {
  it("knows a campaign's main note", () => {
    expect(isMainNote("Pale Moon/Pale Moon.md")).toBe(true);
  });

  it("leaves out every other note", () => {
    for (const path of ["Pale Moon/Sessions/Session 1.md", "Pale Moon.md", "Lore/Pale Moon/Pale Moon.md"]) expect(isMainNote(path)).toBe(false);
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
