import { describe, expect, it } from "vitest";
import { pageOfFile } from "../../../src/interface/takeover/opened-file-page";

const FOLDERS = ["Ashen Road", "Pale Moon"];

describe("pageOfFile", () => {
  it("shows a campaign's main note on the dashboard", () => {
    expect(pageOfFile("Pale Moon/Pale Moon.md", FOLDERS)).toBe("home");
  });

  it("shows a note in a campaign's Characters folder on the Characters page", () => {
    expect(pageOfFile("Pale Moon/Characters/Mira.md", FOLDERS)).toBe("cast");
    expect(pageOfFile("Ashen Road/Characters/Allies/Brother Aldric.md", FOLDERS)).toBe("cast");
  });

  it("shows a note directly in a campaign's Fallen folder on the Characters page, and one deeper on its note page", () => {
    expect(pageOfFile("Pale Moon/Fallen/Brann.md", FOLDERS)).toBe("cast");
    expect(pageOfFile("Pale Moon/Fallen/Old/Brann.md", FOLDERS)).toBe("note");
  });

  it("shows a note in a campaign's Places folder on its own note page", () => {
    expect(pageOfFile("Pale Moon/Places/Old Mill.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Ashen Road/Places/Coast/Harbour.md", FOLDERS)).toBe("note");
  });

  it("shows a session note on the Notes page", () => {
    expect(pageOfFile("Pale Moon/Sessions/Session 1.md", FOLDERS)).toBe("notes");
    expect(pageOfFile("Ashen Road/Sessions/Session 12.md", FOLDERS)).toBe("notes");
  });

  it("shows a note in a campaign's Items folder on Party funds", () => {
    expect(pageOfFile("Pale Moon/Items/Silvered lantern.md", FOLDERS)).toBe("funds");
    expect(pageOfFile("Ashen Road/Items/Potions/Potion of healing.md", FOLDERS)).toBe("funds");
  });

  it("shows any other note of a campaign on its own note page, wherever it is in the folder", () => {
    expect(pageOfFile("Pale Moon/Old Mill.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Pale Moon/Places/Gilded Stag.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Pale Moon/Sessions/Recap.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Pale Moon/Sessions/Old/Session 1.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Pale Moon/Session 1.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Pale Moon/Ashen Road.md", FOLDERS)).toBe("note");
    expect(pageOfFile("Pale Moon/Items.md", FOLDERS)).toBe("note");
  });

  it("leaves a campaign's files that aren't Markdown notes to Obsidian, its Characters base too", () => {
    expect(pageOfFile("Pale Moon/Characters.base", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Characters/Mira.png", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Items/Silvered lantern.jpg", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Places.base", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Map.canvas", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Handouts/Letter.pdf", FOLDERS)).toBeNull();
  });

  it("leaves notes outside any campaign to Obsidian, even ones shaped like a campaign's", () => {
    expect(pageOfFile("Gilded Stag.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Gilded Stag.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Characters/Lady Vess.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Characters.base", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Sessions/Session 1.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Items/Silvered lantern.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Old Mill/Old Mill notes.md", FOLDERS)).toBeNull();
  });
});
