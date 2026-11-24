import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, Menu, TAbstractFile } from "obsidian";
import { addEditCharacterItem, editActiveCharacter, openMadeNote } from "../../../src/obsidian/characters/character-editing-hooks";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import { forgetModalWaiters, nextModal, Notice, openedModals, type Modal as StubModal } from "../../stubs/obsidian";
import { MIRA, setUp } from "../../characters/editing/character-editing-setup";

beforeEach(() => {
  Notice.shown = [];
  forgetModalWaiters();
});

const NOTHING_SHOWN = () => null;

describe("editActiveCharacter", () => {
  it("is offered on a character's note without reading it yet", () => {
    const { app, editing, read } = setUp();
    expect(editActiveCharacter(app, editing, NOTHING_SHOWN, true)).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered with no note open and no sheet shown", () => {
    const { app, editing, read } = setUp({ active: null });
    expect(editActiveCharacter(app, editing, NOTHING_SHOWN, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("isn't offered on a note outside a campaign's Characters folder", () => {
    const { app, editing, read } = setUp({ active: "Drafts/Characters/Mira.md" });
    expect(editActiveCharacter(app, editing, NOTHING_SHOWN, false)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("is offered on the sheet the campaign tab shows, and opens the dialog for that character", async () => {
    const { app, editing, read } = setUp({ active: null, ownNote: "speed: 40 ft.\n" });
    const before = openedModals.length;
    const opened = nextModal();
    expect(editActiveCharacter(app, editing, () => MIRA, true)).toBe(true);
    expect(read).not.toHaveBeenCalled();
    expect(editActiveCharacter(app, editing, () => MIRA, false)).toBe(true);
    await opened;
    expect(openedModals.length).toBe(before + 1);
    expect(read).toHaveBeenCalledOnce();
    expect((openedModals[before] as unknown as StubModal).title).toBe("Edit character");
  });

  it("isn't offered when the campaign tab shows a page with no character", () => {
    const { app, editing } = setUp({ active: null });
    expect(editActiveCharacter(app, editing, () => "Pale Moon/Characters.base", true)).toBe(false);
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
    const { editing, read } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(editing, menu, { path: MIRA } as TAbstractFile);
    expect(items.map(({ title, icon }) => [title, icon])).toEqual([["Edit character", "pencil"]]);
    expect(read).not.toHaveBeenCalled();
    const before = openedModals.length;
    const opened = nextModal();
    items[0]!.click();
    await opened;
    expect(openedModals.length).toBe(before + 1);
  });

  it("adds nothing to the menu of another note", () => {
    const { editing } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(editing, menu, { path: "Drafts/Characters/Mira.md" } as TAbstractFile);
    expect(items).toEqual([]);
  });

  it("adds nothing to the menu of a folder named like a note", () => {
    const { editing } = setUp();
    const { menu, items } = menuOf();
    addEditCharacterItem(editing, menu, { path: "Pale Moon/Characters/Old.md" } as TAbstractFile);
    expect(items).toEqual([]);
  });
});

describe("openMadeNote", () => {
  function opening(found: boolean) {
    const file = { path: MIRA };
    const openFile = vi.fn(async () => {});
    const getLeaf = vi.fn(() => ({ openFile }));
    const app = { workspace: { getLeaf } } as unknown as App;
    const getFileByPath = vi.fn((path: string) => {
      if (!found) return null;
      return { ...file, path };
    });
    const gate = { files: { getFileByPath } } as unknown as Gate;
    return { app, gate, getLeaf, openFile, getFileByPath };
  }

  it("opens the made note in the tab in use, as the gate holds it", async () => {
    const { app, gate, getLeaf, openFile, getFileByPath } = opening(true);
    await openMadeNote(app, gate, { path: MIRA, basename: "Mira" });
    expect(getFileByPath).toHaveBeenCalledExactlyOnceWith(MIRA);
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith(false);
    expect(openFile).toHaveBeenCalledExactlyOnceWith({ path: MIRA });
  });

  it("opens nothing when the gate no longer holds the note", async () => {
    const { app, gate, getLeaf } = opening(false);
    await openMadeNote(app, gate, { path: MIRA, basename: "Mira" });
    expect(getLeaf).not.toHaveBeenCalled();
  });
});
