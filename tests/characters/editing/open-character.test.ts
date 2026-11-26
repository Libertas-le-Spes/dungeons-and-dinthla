import { beforeEach, describe, expect, it, vi } from "vitest";
import { NO_CAMPAIGN } from "../../../src/campaign/paths/campaign-folders";
import { EDIT_WHERE, editCharacter, NOT_A_CHARACTER, openEditCharacter, openNewCharacter, type CharacterEditing } from "../../../src/characters/editing/open-character";
import { MIRA, setUp } from "./character-editing-setup";
import { forgetModalWaiters, nextModal, Notice, openedModals } from "../../stubs/obsidian";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import { lastDialog } from "../../campaign/dialog-campaign";

beforeEach(() => {
  Notice.shown = [];
  forgetModalWaiters();
});

function lastDialogText(): string {
  return String(openedModals[openedModals.length - 1]!.contentEl.textContent);
}

describe("openNewCharacter", () => {
  it("asks for a campaign when there is none", () => {
    const before = openedModals.length;
    openNewCharacter({ showing: OBSIDIAN_SHOWING } as CharacterEditing, null, vi.fn(), () => {});
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals.length).toBe(before);
  });

  it("says the note goes in the campaign's Characters folder", () => {
    const { editing } = setUp();
    const before = openedModals.length;
    openNewCharacter(editing, "Pale Moon", vi.fn(), () => {});
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).toContain("Adds a note to Pale Moon/Characters.");
  });
});

describe("a new character's note", () => {
  function savedNew(openMade: (note: { path: string; basename: string }) => Promise<void>) {
    const { editing } = setUp();
    openNewCharacter(editing, "Pale Moon", openMade, () => {});
    return lastDialog<{ dialog: { save(entry: { name: string; type: string; subtitle: string; speed: string }): Promise<boolean> } }>().dialog.save({ name: "Vess", type: "", subtitle: "", speed: "" });
  }

  it("opens once it is made", async () => {
    const openMade = vi.fn(async () => {});
    expect(await savedNew(openMade)).toBe(true);
    expect(openMade).toHaveBeenCalledExactlyOnceWith({ path: "Pale Moon/Characters/Vess.md", basename: "Vess" });
  });

  it("says it was made when it couldn't be opened", async () => {
    const refused = Promise.reject(new Error("no tab"));
    await savedNew(() => refused);
    await refused.catch(() => undefined);
    expect(Notice.shown).toEqual(["Vess was made but couldn't be opened: no tab"]);
  });
});

describe("openEditCharacter", () => {
  it("shows what the sessions taught about the character, and that links follow only with Obsidian's setting on", async () => {
    const sessions = [{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "[[Mira]] speed: 30 ft.\n[[Vess]] type: fiend\n" }];
    const { editing, fileAt } = setUp({ sessions, ownNote: "speed: 40 ft.\n" });
    const before = openedModals.length;
    await openEditCharacter(editing, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).toContain("Learned in the sessions: 30 ft.");
    expect(lastDialogText()).not.toContain("fiend");
    expect(lastDialogText()).toContain(EDIT_WHERE);
  });

  it("opens for a character the sessions never mention", async () => {
    const { editing, fileAt } = setUp();
    const before = openedModals.length;
    await openEditCharacter(editing, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(openedModals.length).toBe(before + 1);
    expect(lastDialogText()).not.toContain("Learned");
  });

  it("says why when the note can't be read", async () => {
    const { editing, fileAt } = setUp({ readFails: true });
    const before = openedModals.length;
    await openEditCharacter(editing, { file: fileAt(MIRA), campaignFolder: "Pale Moon" });
    expect(Notice.shown).toEqual(["Couldn't read Mira: the disk is gone"]);
    expect(openedModals.length).toBe(before);
  });
});

describe("editCharacter", () => {
  it("opens the dialog for a character's note", async () => {
    const { editing, fileAt, read } = setUp();
    const before = openedModals.length;
    const opened = nextModal();
    editCharacter(editing, fileAt(MIRA));
    await opened;
    expect(openedModals.length).toBe(before + 1);
    expect(read).toHaveBeenCalledOnce();
  });

  it("says so for a note outside a campaign's Characters folder", () => {
    const { editing, fileAt, read } = setUp();
    const before = openedModals.length;
    editCharacter(editing, fileAt("Drafts/Characters/Mira.md"));
    expect(Notice.shown).toEqual([NOT_A_CHARACTER]);
    expect(read).not.toHaveBeenCalled();
    expect(openedModals.length).toBe(before);
  });
});
