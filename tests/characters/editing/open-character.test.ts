import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, Menu, TAbstractFile, TFile } from "obsidian";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { NO_CAMPAIGN } from "../../../src/campaign/paths/campaign-folders";
import type { CharacterNotes } from "../../../src/characters/reading/character-notes";
import {
  addEditCharacterItem,
  EDIT_WHERE,
  editActiveCharacter,
  editCharacter,
  NOT_A_CHARACTER,
  openEditCharacter,
  openNewCharacter,
} from "../../../src/characters/editing/open-character";
import { Notice, openedModals } from "../../stubs/obsidian";
import type { Gate } from "../../../src/fence/gate/gatekeeper";

const CAMPAIGNS = ["Ashen Road", "Pale Moon"];
const MIRA = "Pale Moon/Characters/Mira.md";

beforeEach(() => {
  Notice.shown = [];
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
  } as unknown as App;
  const gate = {
    files: {
      read,
      getFileByPath: (path: string) => {
        if (!files.includes(path)) return null;
        return fileAt(path);
      },
    },
  } as unknown as Gate;
  const notes = {
    campaignFolders: () => CAMPAIGNS,
    sessionsOf: async () => sessions,
    pathOfLink: (linktext: string) => `Pale Moon/Characters/${linktext}.md`,
  } as unknown as CharacterNotes;
  return { app, gate, notes, read, fileAt };
}

function lastDialogText(): string {
  return String(openedModals[openedModals.length - 1]!.contentEl.textContent);
}

describe("openNewCharacter", () => {
  it("asks for a campaign when there is none", () => {
    const before = openedModals.length;
    openNewCharacter({} as App, {} as Gate, null, () => {});
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals.length).toBe(before);
  });

  it("says the note goes in the campaign's Characters folder", () => {
    const { app, gate } = setUp();
    const before = openedModals.length;
    openNewCharacter(app, gate, "Pale Moon", () => {});
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).toContain("Adds a note to Pale Moon/Characters.");
  });
});

describe("openEditCharacter", () => {
  it("shows what the sessions taught about the character, and that links follow only with Obsidian's setting on", async () => {
    const sessions = [{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "[[Mira]] speed: 30 ft.\n[[Vess]] type: fiend\n" }];
    const { app, gate, notes, fileAt } = setUp({ sessions, ownNote: "speed: 40 ft.\n" });
    const before = openedModals.length;
    await openEditCharacter(app, gate, notes, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).toContain("Learned in the sessions: 30 ft.");
    expect(lastDialogText()).not.toContain("fiend");
    expect(lastDialogText()).toContain(EDIT_WHERE);
  });

  it("opens for a character the sessions never mention", async () => {
    const { app, gate, notes, fileAt } = setUp();
    const before = openedModals.length;
    await openEditCharacter(app, gate, notes, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).not.toContain("Learned");
  });

  it("says why when the note can't be read", async () => {
    const { app, gate, notes, fileAt } = setUp({ readFails: true });
    const before = openedModals.length;
    await openEditCharacter(app, gate, notes, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(Notice.shown).toEqual(["Couldn't read Mira: the disk is gone"]);
    expect(openedModals.length).toBe(before);
  });
});

describe("editCharacter", () => {
  it("opens the dialog for a character's note", async () => {
    const { app, gate, notes, fileAt, read } = setUp();
    const before = openedModals.length;
    editCharacter(app, gate, notes, fileAt(MIRA));
    await vi.waitFor(() => expect(openedModals.length).toBe(before + 1));
    expect(read).toHaveBeenCalledOnce();
  });

  it("says so for a note outside a campaign's Characters folder", () => {
    const { app, gate, notes, fileAt, read } = setUp();
    const before = openedModals.length;
    editCharacter(app, gate, notes, fileAt("Drafts/Characters/Mira.md"));
    expect(Notice.shown).toEqual([NOT_A_CHARACTER]);
    expect(read).not.toHaveBeenCalled();
    expect(openedModals.length).toBe(before);
  });
});

const NOTHING_SHOWN = () => null;

describe("editActiveCharacter", () => {
  it("is offered on a character's note without reading it yet", () => {
    const { app, gate, notes, read } = setUp();
    expect(editActiveCharacter(app, gate, notes, NOTHING_SHOWN, true)).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered with no note open and no sheet shown", () => {
    const { app, gate, notes, read } = setUp({ active: null });
    expect(editActiveCharacter(app, gate, notes, NOTHING_SHOWN, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered on a note outside a campaign's Characters folder", () => {
    const { app, gate, notes, read } = setUp({ active: "Drafts/Characters/Mira.md" });
    expect(editActiveCharacter(app, gate, notes, NOTHING_SHOWN, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("is offered on the sheet the campaign tab shows, and opens the dialog for that character", async () => {
    const { app, gate, notes, read } = setUp({ active: null, ownNote: "speed: 40 ft.\n" });
    const before = openedModals.length;
    expect(editActiveCharacter(app, gate, notes, () => MIRA, true)).toBe(true);
    expect(read).not.toHaveBeenCalled();
    expect(editActiveCharacter(app, gate, notes, () => MIRA, false)).toBe(true);
    await vi.waitFor(() => expect(openedModals.length).toBe(before + 1));
    expect(read).toHaveBeenCalledOnce();
    expect(openedModals[before]!.title).toBe("Edit character");
  });

  it("isn't offered when the campaign tab shows a page with no character", () => {
    const { app, gate, notes } = setUp({ active: null });
    expect(editActiveCharacter(app, gate, notes, () => "Pale Moon/Characters.base", true)).toBe(false);
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
    const { app, gate, notes, read } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(app, gate, notes, menu, { path: MIRA } as TAbstractFile);
    expect(items.map(({ title, icon }) => [title, icon])).toEqual([["Edit character", "pencil"]]);
    expect(read).not.toHaveBeenCalled();
    const before = openedModals.length;
    items[0]!.click();
    await vi.waitFor(() => expect(openedModals.length).toBe(before + 1));
  });

  it("adds nothing to the menu of another note", () => {
    const { app, gate, notes } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(app, gate, notes, menu, { path: "Drafts/Characters/Mira.md" } as TAbstractFile);
    expect(items).toEqual([]);
  });

  it("adds nothing to the menu of a folder named like a note", () => {
    const { app, gate, notes } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(app, gate, notes, menu, { path: "Pale Moon/Characters/Old.md" } as TAbstractFile);
    expect(items).toEqual([]);
  });
});
