import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { NO_CAMPAIGN } from "../../src/campaign/campaign-folders";
import { editActiveCharacter, isCharacterNote, openEditCharacter, openNewCharacter } from "../../src/characters/open-character";
import { Notice } from "../stubs/obsidian";

const CAMPAIGNS = ["Ashen Road", "Pale Moon"];

beforeEach(() => {
  Notice.shown = [];
});

describe("isCharacterNote", () => {
  it("is a Markdown note in a campaign's Characters folder", () => {
    expect(isCharacterNote("Pale Moon/Characters/Mira.md", CAMPAIGNS)).toBe(true);
    expect(isCharacterNote("Pale Moon/Characters/Villains/Vess.md", CAMPAIGNS)).toBe(true);
  });

  it("isn't a note anywhere else", () => {
    expect(isCharacterNote("Pale Moon/Sessions/Session 1.md", CAMPAIGNS)).toBe(false);
    expect(isCharacterNote("Pale Moon/Characters.md", CAMPAIGNS)).toBe(false);
    expect(isCharacterNote("Pale Moon/Characters.base", CAMPAIGNS)).toBe(false);
  });

  it("isn't a note in a folder that isn't a campaign", () => {
    expect(isCharacterNote("Drafts/Characters/Mira.md", CAMPAIGNS)).toBe(false);
  });

  it("isn't a file in the Characters folder that isn't a note", () => {
    expect(isCharacterNote("Pale Moon/Characters/Mira.png", CAMPAIGNS)).toBe(false);
  });
});

describe("openNewCharacter", () => {
  it("asks for a campaign when there is none", () => {
    openNewCharacter({} as App, null, () => {});
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
  });
});

function appWithActive(active: string | null) {
  const read = vi.fn(async () => "");
  const paths = ["Pale Moon/Pale Moon.md", "Pale Moon/Characters/Mira.md", "Drafts/Characters/Mira.md"];
  const app = {
    workspace: {
      getActiveFile: () => {
        if (active === null) return null;
        return { path: active } as TFile;
      },
    },
    vault: { getFiles: () => paths.map((path) => ({ path }) as TFile), read },
  } as unknown as App;
  return { app, read };
}

describe("editActiveCharacter", () => {
  it("is offered on a character's note without reading it yet", () => {
    const { app, read } = appWithActive("Pale Moon/Characters/Mira.md");
    expect(editActiveCharacter(app, true)).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered with no note open", () => {
    const { app, read } = appWithActive(null);
    expect(editActiveCharacter(app, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered on a note outside a campaign's Characters folder", () => {
    const { app, read } = appWithActive("Drafts/Characters/Mira.md");
    expect(editActiveCharacter(app, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });
});

describe("openEditCharacter", () => {
  it("says why when the note can't be read", async () => {
    const app = { vault: { read: async () => Promise.reject(new Error("the disk is gone")) } } as unknown as App;
    await openEditCharacter(app, { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile);
    expect(Notice.shown).toEqual(["Couldn't read Mira: the disk is gone"]);
  });
});
