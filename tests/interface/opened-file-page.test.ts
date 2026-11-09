import { describe, expect, it } from "vitest";
import { pageOfFile } from "../../src/interface/opened-file-page";

const FOLDERS = ["Ashen Road", "Pale Moon"];

describe("pageOfFile", () => {
  it("shows a campaign's main note on the dashboard", () => {
    expect(pageOfFile("Pale Moon/Pale Moon.md", FOLDERS)).toBe("home");
  });

  it("shows a note in a campaign's Characters folder on the Characters page", () => {
    expect(pageOfFile("Pale Moon/Characters/Mira.md", FOLDERS)).toBe("cast");
    expect(pageOfFile("Ashen Road/Characters/Allies/Brother Aldric.md", FOLDERS)).toBe("cast");
  });

  it("shows a campaign's Characters base on the Characters page", () => {
    expect(pageOfFile("Pale Moon/Characters.base", FOLDERS)).toBe("cast");
  });

  it("leaves sessions, other notes and other files of a campaign to Obsidian", () => {
    expect(pageOfFile("Pale Moon/Sessions/Session 1.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Places/Old Mill.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Characters/Mira.png", FOLDERS)).toBeNull();
    expect(pageOfFile("Pale Moon/Places.base", FOLDERS)).toBeNull();
  });

  it("leaves a campaign's main note named after another campaign to Obsidian", () => {
    expect(pageOfFile("Pale Moon/Ashen Road.md", FOLDERS)).toBeNull();
  });

  it("leaves notes outside any campaign to Obsidian, even ones shaped like a campaign's", () => {
    expect(pageOfFile("Gilded Stag.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Gilded Stag.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Characters/Lady Vess.md", FOLDERS)).toBeNull();
    expect(pageOfFile("Gilded Stag/Characters.base", FOLDERS)).toBeNull();
  });
});
