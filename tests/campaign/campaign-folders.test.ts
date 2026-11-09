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

const PALE_MOON = "Games/D&D/Pale Moon";
const ASHEN_ROAD = "Games/D&D/Ashen Road";

describe("campaignNotePathOf", () => {
  const folders = [ASHEN_ROAD, PALE_MOON];

  it("gives the main note of the campaign a note is in", () => {
    expect(campaignNotePathOf("Games/D&D/Pale Moon/Characters/Mira.md", folders)).toBe("Games/D&D/Pale Moon/Pale Moon.md");
  });

  it("gives none for a note outside every campaign", () => {
    expect(campaignNotePathOf("Mira.md", folders)).toBeNull();
    expect(campaignNotePathOf("Games/D&D/Mira.md", folders)).toBeNull();
  });
});

describe("findCampaignFolders", () => {
  it("finds each folder directly inside the Campaigns folder with a main note of its own name, in path order", () => {
    expect(
      findCampaignFolders(
        [
          "Games/D&D/Pale Moon/Pale Moon.md",
          "Games/D&D/Pale Moon/Sessions/Session 1.md",
          "Games/D&D/Ashen Road/Ashen Road.md",
          "Games/D&D/Recipes/Bread.md",
          "Games/D&D/Inbox.md",
          "Games/D&D/Lore/Pale Moon/Pale Moon.md",
          "Games/Silver Road/Silver Road.md",
          "Silver Road/Silver Road.md",
        ],
        "Games/D&D",
      ),
    ).toEqual([ASHEN_ROAD, PALE_MOON]);
  });

  it("finds a campaign in a Campaigns folder at the top of the vault", () => {
    expect(findCampaignFolders(["D&D/Pale Moon/Pale Moon.md"], "D&D")).toEqual(["D&D/Pale Moon"]);
  });

  it("finds no campaign while no Campaigns folder is set, even where a main note sits, in a folder named null too", () => {
    expect(findCampaignFolders(["Pale Moon/Pale Moon.md", "D&D/Pale Moon/Pale Moon.md", "null/Pale Moon/Pale Moon.md"], null)).toEqual([]);
  });

  it("doesn't take a folder beside the Campaigns folder whose name only starts the same", () => {
    expect(findCampaignFolders(["D&D Old/Pale Moon/Pale Moon.md"], "D&D")).toEqual([]);
  });
});

describe("campaignFolderOf", () => {
  const folders = [ASHEN_ROAD, PALE_MOON];

  it("finds the campaign a note belongs to", () => {
    expect(campaignFolderOf("Games/D&D/Pale Moon/Sessions/Session 1.md", folders)).toBe(PALE_MOON);
  });

  it("finds no campaign for a note outside them, or in a folder whose name only starts the same", () => {
    expect(campaignFolderOf("Games/D&D/Recipes/Bread.md", folders)).toBeNull();
    expect(campaignFolderOf("Inbox.md", folders)).toBeNull();
    expect(campaignFolderOf("Games/D&D/Pale Moon Two/Pale Moon Two.md", folders)).toBeNull();
  });
});

describe("mainNotePathOf", () => {
  it("names the note at the top of the folder after the folder", () => {
    expect(mainNotePathOf(PALE_MOON)).toBe("Games/D&D/Pale Moon/Pale Moon.md");
  });

  it("names it after the folder at the top of the vault too", () => {
    expect(mainNotePathOf("Pale Moon")).toBe("Pale Moon/Pale Moon.md");
  });
});

describe("charactersFolderOf", () => {
  it("is the Characters folder at the campaign's top", () => {
    expect(charactersFolderOf(PALE_MOON)).toBe("Games/D&D/Pale Moon/Characters");
  });
});

describe("charactersBasePathOf", () => {
  it("is the Characters base at the campaign's top", () => {
    expect(charactersBasePathOf(PALE_MOON)).toBe("Games/D&D/Pale Moon/Characters.base");
  });
});

describe("campaignOfCharacter", () => {
  const folders = [ASHEN_ROAD, PALE_MOON];

  it("is the campaign of a Markdown note in its Characters folder, or a folder inside it", () => {
    expect(campaignOfCharacter("Games/D&D/Pale Moon/Characters/Mira.md", folders)).toBe(PALE_MOON);
    expect(campaignOfCharacter("Games/D&D/Ashen Road/Characters/Villains/Lady Vess.md", folders)).toBe(ASHEN_ROAD);
  });

  it("is nothing for another file in the Characters folder", () => {
    expect(campaignOfCharacter("Games/D&D/Pale Moon/Characters/Mira.png", folders)).toBeNull();
  });

  it("is nothing for a note elsewhere in the campaign, or in a folder only named like Characters", () => {
    expect(campaignOfCharacter("Games/D&D/Pale Moon/Sessions/Session 1.md", folders)).toBeNull();
    expect(campaignOfCharacter("Games/D&D/Pale Moon/Characters.md", folders)).toBeNull();
    expect(campaignOfCharacter("Games/D&D/Pale Moon/Characters.base", folders)).toBeNull();
    expect(campaignOfCharacter("Games/D&D/Pale Moon/Characters old/Mira.md", folders)).toBeNull();
  });

  it("is nothing for a Characters folder of a folder that isn't a campaign", () => {
    expect(campaignOfCharacter("Games/D&D/Gilded Stag/Characters/Mira.md", folders)).toBeNull();
    expect(campaignOfCharacter("Pale Moon/Characters/Mira.md", folders)).toBeNull();
  });
});

describe("campaignOfItem", () => {
  const folders = [ASHEN_ROAD, PALE_MOON];

  it("is the campaign of a Markdown note in its Items folder, or a folder inside it", () => {
    expect(campaignOfItem("Games/D&D/Pale Moon/Items/Silvered lantern.md", folders)).toBe(PALE_MOON);
    expect(campaignOfItem("Games/D&D/Ashen Road/Items/Potions/Potion of healing.md", folders)).toBe(ASHEN_ROAD);
  });

  it("is nothing for another file in the Items folder, a note elsewhere, or a folder only named like Items", () => {
    expect(campaignOfItem("Games/D&D/Pale Moon/Items/Silvered lantern.png", folders)).toBeNull();
    expect(campaignOfItem("Games/D&D/Pale Moon/Places/Old Mill.md", folders)).toBeNull();
    expect(campaignOfItem("Games/D&D/Pale Moon/Items.md", folders)).toBeNull();
    expect(campaignOfItem("Games/D&D/Pale Moon/Items old/Silvered lantern.md", folders)).toBeNull();
  });

  it("is nothing for an Items folder of a folder that isn't a campaign", () => {
    expect(campaignOfItem("Games/D&D/Gilded Stag/Items/Silvered lantern.md", folders)).toBeNull();
  });
});

describe("isMainNote", () => {
  it("knows the main note of a campaign in the Campaigns folder", () => {
    expect(isMainNote("Games/D&D/Pale Moon/Pale Moon.md", "Games/D&D")).toBe(true);
  });

  it("leaves out every other note", () => {
    for (const path of [
      "Games/D&D/Pale Moon/Sessions/Session 1.md",
      "Games/D&D/Pale Moon.md",
      "Games/D&D/Lore/Pale Moon/Pale Moon.md",
      "Pale Moon/Pale Moon.md",
    ]) {
      expect(isMainNote(path, "Games/D&D")).toBe(false);
    }
  });

  it("knows no main note while no Campaigns folder is set", () => {
    expect(isMainNote("Pale Moon/Pale Moon.md", null)).toBe(false);
  });
});

describe("chosenCampaignFolder", () => {
  const folders = [ASHEN_ROAD, PALE_MOON];

  it("keeps the chosen campaign", () => {
    expect(chosenCampaignFolder(PALE_MOON, folders)).toBe(PALE_MOON);
  });

  it("takes the first campaign when none was chosen, or the chosen one is gone", () => {
    expect(chosenCampaignFolder(null, folders)).toBe(ASHEN_ROAD);
    expect(chosenCampaignFolder("Games/D&D/Lost Mines", folders)).toBe(ASHEN_ROAD);
  });

  it("has no campaign when the Campaigns folder holds none", () => {
    expect(chosenCampaignFolder(PALE_MOON, [])).toBeNull();
  });
});

describe("startingCampaignFolder", () => {
  const folders = [ASHEN_ROAD, PALE_MOON, "Games/D&D/Silver Coast"];

  it("starts in the campaign of the open note", () => {
    expect(startingCampaignFolder("Games/D&D/Silver Coast/Sessions/Session 1.md", PALE_MOON, folders)).toBe("Games/D&D/Silver Coast");
  });

  it("starts in the chosen campaign when no note is open, or the open note is outside every campaign", () => {
    expect(startingCampaignFolder(null, PALE_MOON, folders)).toBe(PALE_MOON);
    expect(startingCampaignFolder("Recipes/Bread.md", PALE_MOON, folders)).toBe(PALE_MOON);
  });
});

describe("isSessionNote", () => {
  const exists = (path: string) => path === "Games/D&D/Pale Moon/Pale Moon.md";

  it("knows a session note of a campaign", () => {
    expect(isSessionNote("Games/D&D/Pale Moon/Sessions/Session 3.md", "Games/D&D", exists)).toBe(true);
  });

  it("leaves out other notes, and sessions of a folder that isn't a campaign", () => {
    for (const path of ["Games/D&D/Pale Moon/Characters/Mira.md", "Games/D&D/Recipes/Sessions/Session 1.md", "Games/D&D/Session 1.md"]) {
      expect(isSessionNote(path, "Games/D&D", exists)).toBe(false);
    }
  });

  it("knows no session note while no Campaigns folder is set", () => {
    expect(isSessionNote("Games/D&D/Pale Moon/Sessions/Session 3.md", null, exists)).toBe(false);
  });
});
