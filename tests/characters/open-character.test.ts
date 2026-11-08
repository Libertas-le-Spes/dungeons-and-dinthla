import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, Menu, TAbstractFile, TFile } from "obsidian";
import type { SessionNote } from "../../src/campaign/campaign";
import { NO_CAMPAIGN } from "../../src/campaign/campaign-folders";
import type { CharacterNotes } from "../../src/characters/character-notes";
import {
  addEditCharacterItem,
  campaignOfCharacter,
  EDIT_WHERE,
  editActiveCharacter,
  openEditCharacter,
  openNewCharacter,
} from "../../src/characters/open-character";
import { Notice, openedModals } from "../stubs/obsidian";

const CAMPAIGNS = ["Ashen Road", "Pale Moon"];
const MIRA = "Pale Moon/Characters/Mira.md";

beforeEach(() => {
  Notice.shown = [];
});

describe("campaignOfCharacter", () => {
  it("is the campaign of a Markdown note in its Characters folder", () => {
    expect(campaignOfCharacter(MIRA, CAMPAIGNS)).toBe("Pale Moon");
    expect(campaignOfCharacter("Ashen Road/Characters/Villains/Vess.md", CAMPAIGNS)).toBe("Ashen Road");
  });

  it("is nothing for a note anywhere else", () => {
    expect(campaignOfCharacter("Pale Moon/Sessions/Session 1.md", CAMPAIGNS)).toBeNull();
    expect(campaignOfCharacter("Pale Moon/Characters.md", CAMPAIGNS)).toBeNull();
    expect(campaignOfCharacter("Pale Moon/Characters.base", CAMPAIGNS)).toBeNull();
  });

  it("is nothing for a note in a folder that isn't a campaign", () => {
    expect(campaignOfCharacter("Drafts/Characters/Mira.md", CAMPAIGNS)).toBeNull();
  });

  it("is nothing for a file in the Characters folder that isn't a note", () => {
    expect(campaignOfCharacter("Pale Moon/Characters/Mira.png", CAMPAIGNS)).toBeNull();
  });
});

describe("openNewCharacter", () => {
  it("asks for a campaign when there is none", () => {
    const before = openedModals.length;
    openNewCharacter({} as App, null, () => {});
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals.length).toBe(before);
  });
});

interface Setup {
  active?: string | null;
  files?: string[];
  ownNote?: string;
  sessions?: SessionNote[];
  readFails?: boolean;
}

function setUp({ active = MIRA, files = [MIRA, "Drafts/Characters/Mira.md"], ownNote = "", sessions = [], readFails = false }: Setup = {}) {
  const read = vi.fn(async () => {
    if (readFails) throw new Error("the disk is gone");
    return ownNote;
  });
  const fileAt = (path: string) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "") }) as TFile;
  const app = {
    workspace: {
      getActiveFile: () => {
        if (active === null) return null;
        return fileAt(active);
      },
    },
    vault: {
      read,
      getFileByPath: (path: string) => {
        if (!files.includes(path)) return null;
        return fileAt(path);
      },
    },
  } as unknown as App;
  const notes = {
    campaignFolders: () => CAMPAIGNS,
    sessionsOf: async () => sessions,
    pathOfLink: (linktext: string) => `Pale Moon/Characters/${linktext}.md`,
  } as unknown as CharacterNotes;
  return { app, notes, read, fileAt };
}

function lastDialogText(): string {
  return String(openedModals[openedModals.length - 1]!.contentEl.textContent);
}

describe("openEditCharacter", () => {
  it("shows what the sessions taught about the character, and that links follow only with Obsidian's setting on", async () => {
    const sessions = [{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "[[Mira]] speed: 30 ft.\n[[Vess]] type: fiend\n" }];
    const { app, notes, fileAt } = setUp({ sessions, ownNote: "speed: 40 ft.\n" });
    const before = openedModals.length;
    await openEditCharacter(app, notes, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).toContain("Learned in the sessions: 30 ft.");
    expect(lastDialogText()).not.toContain("fiend");
    expect(lastDialogText()).toContain(EDIT_WHERE);
  });

  it("opens for a character the sessions never mention", async () => {
    const { app, notes, fileAt } = setUp();
    const before = openedModals.length;
    await openEditCharacter(app, notes, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).not.toContain("Learned");
  });

  it("says why when the note can't be read", async () => {
    const { app, notes, fileAt } = setUp({ readFails: true });
    const before = openedModals.length;
    await openEditCharacter(app, notes, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(Notice.shown).toEqual(["Couldn't read Mira: the disk is gone"]);
    expect(openedModals.length).toBe(before);
  });
});

describe("editActiveCharacter", () => {
  it("is offered on a character's note without reading it yet", () => {
    const { app, notes, read } = setUp();
    expect(editActiveCharacter(app, notes, true)).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered with no note open", () => {
    const { app, notes, read } = setUp({ active: null });
    expect(editActiveCharacter(app, notes, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered on a note outside a campaign's Characters folder", () => {
    const { app, notes, read } = setUp({ active: "Drafts/Characters/Mira.md" });
    expect(editActiveCharacter(app, notes, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });
});

function menuOf() {
  const items: { title: string; icon: string; click: () => void }[] = [];
  const menu = {
    addItem: (build: (item: unknown) => void) => {
      const item = { title: "", icon: "", click: () => {} };
      const builder = {
        setTitle: (title: string) => {
          item.title = title;
          return builder;
        },
        setIcon: (icon: string) => {
          item.icon = icon;
          return builder;
        },
        onClick: (click: () => void) => {
          item.click = click;
          return builder;
        },
      };
      build(builder);
      items.push(item);
      return menu;
    },
  };
  return { menu: menu as unknown as Menu, items };
}

describe("addEditCharacterItem", () => {
  it("adds Edit character to a character note's menu, which opens the dialog", async () => {
    const { app, notes, read } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(app, notes, menu, { path: MIRA } as TAbstractFile);
    expect(items.map(({ title, icon }) => [title, icon])).toEqual([["Edit character", "pencil"]]);
    expect(read).not.toHaveBeenCalled();
    const before = openedModals.length;
    items[0]!.click();
    await vi.waitFor(() => expect(openedModals.length).toBe(before + 1));
  });

  it("adds nothing to the menu of another note", () => {
    const { app, notes } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(app, notes, menu, { path: "Drafts/Characters/Mira.md" } as TAbstractFile);
    expect(items).toEqual([]);
  });

  it("adds nothing to the menu of a folder named like a note", () => {
    const { app, notes } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(app, notes, menu, { path: "Pale Moon/Characters/Old.md" } as TAbstractFile);
    expect(items).toEqual([]);
  });
});
