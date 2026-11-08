import { beforeEach, describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { BASES_OFF, charactersBaseText, openCharacters } from "../../src/characters/open-characters";
import { NO_CAMPAIGN } from "../../src/campaign/campaign-folders";
import { Notice } from "../stubs/obsidian";

function appWith(existing: string[], failCreate = false) {
  const files = new Map(existing.map((path) => [path, { path } as TFile]));
  const created: { path: string; text: string }[] = [];
  const opened: string[] = [];
  const app = {
    vault: {
      getFileByPath: (path: string) => {
        const file = files.get(path);
        if (file === undefined) return null;
        return file;
      },
      create: async (path: string, text: string) => {
        if (failCreate) throw new Error("the disk is full");
        created.push({ path, text });
        return { path } as TFile;
      },
    },
    workspace: { getLeaf: () => ({ openFile: async (file: TFile) => opened.push(file.path) }) },
  } as unknown as App;
  return { app, created, opened };
}

beforeEach(() => {
  Notice.shown = [];
});

describe("openCharacters", () => {
  it("makes the campaign's Characters.base the first time and opens it", async () => {
    const { app, created, opened } = appWith([]);
    await openCharacters(app, "Pale Moon", true);
    expect(created).toEqual([{ path: "Pale Moon/Characters.base", text: charactersBaseText("Pale Moon") }]);
    expect(opened).toEqual(["Pale Moon/Characters.base"]);
  });

  it("opens the Characters.base already there without writing it", async () => {
    const { app, created, opened } = appWith(["Pale Moon/Characters.base"]);
    await openCharacters(app, "Pale Moon", true);
    expect(created).toEqual([]);
    expect(opened).toEqual(["Pale Moon/Characters.base"]);
  });

  it("asks for Bases to be turned on when it is off", async () => {
    const { app, created, opened } = appWith([]);
    await openCharacters(app, "Pale Moon", false);
    expect(Notice.shown).toEqual([BASES_OFF]);
    expect([...created, ...opened]).toEqual([]);
  });

  it("asks for a campaign when there is none", async () => {
    const { app, created, opened } = appWith([]);
    await openCharacters(app, null, true);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect([...created, ...opened]).toEqual([]);
  });

  it("says why when the file can't be made", async () => {
    const { app, opened } = appWith([], true);
    await openCharacters(app, "Pale Moon", true);
    expect(Notice.shown).toEqual(["Couldn't open the characters gallery: the disk is full"]);
    expect(opened).toEqual([]);
  });
});

describe("charactersBaseText", () => {
  it("shows the Markdown notes in the campaign's Characters folder in the gallery", () => {
    expect(charactersBaseText("Pale Moon")).toBe(
      [
        "filters:",
        "  and:",
        `    - 'file.inFolder("Pale Moon/Characters")'`,
        `    - 'file.ext == "md"'`,
        "views:",
        "  - type: dungeons-and-dinthla-characters",
        "    name: Characters",
        "",
      ].join("\n"),
    );
  });

  it("keeps quotes in the folder's name from ending the filter early", () => {
    expect(charactersBaseText(`Vess's "Road"`).split("\n")[2]).toBe(`    - 'file.inFolder("Vess''s \\"Road\\"/Characters")'`);
  });
});
