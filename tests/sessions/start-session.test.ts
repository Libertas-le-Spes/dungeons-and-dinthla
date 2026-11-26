import { afterEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { Notice, openedModals } from "../stubs/obsidian";
import { NO_CAMPAIGN } from "../../src/campaign/paths/campaign-folders";
import { startSession } from "../../src/sessions/start-session";
import { NewSessionDialog } from "../../src/sessions/new-session-dialog";
import type { SessionMaking } from "../../src/sessions/create-session";
import { ModalFrame } from "../../src/obsidian/views/frames/modal-frame";
import { OBSIDIAN_SHOWING } from "../host/showing/obsidian-showing";

function appWith(paths: string[], { createFails = false } = {}) {
  const create = vi.fn(async (path: string) => {
    if (createFails) throw new Error("Disk is full");
    return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
  });
  const vault = {
    getFiles: () => paths.map((path) => ({ path }) as TFile),
    getFolderByPath: () => ({}),
    createFolder: vi.fn(),
    create,
  };
  const fileManager = { processFrontMatter: vi.fn(async () => {}) };
  const getLeaf = vi.fn();
  const app = { workspace: { getLeaf } } as unknown as App;
  const store = { files: vault.getFiles, hasFolder: () => true, makeFolder: vault.createFolder, make: create };
  const notes = { store, keeping: { changeProperties: fileManager.processFrontMatter } } as unknown as SessionMaking;
  return { app, notes, create, getLeaf };
}

function startDialog(): ModalFrame {
  let opened: ModalFrame | null = null;
  for (const modal of openedModals) {
    if (modal instanceof ModalFrame && modal.dialog instanceof NewSessionDialog) opened = modal;
  }
  if (opened === null) throw new Error("No Start session dialog is open.");
  return opened;
}

async function pressStart(): Promise<void> {
  const modal = startDialog();
  Array.from(modal.contentEl.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Start session")!.click();
  await (modal.dialog as NewSessionDialog).startSettled();
}

afterEach(() => {
  openedModals.length = 0;
  Notice.shown.length = 0;
});

describe("startSession", () => {
  it("makes the next session and shows it on the Notes page, not in the editor", async () => {
    const { notes, create, getLeaf } = appWith(["Pale Moon/Sessions/Session 11.md"]);
    const openNotes = vi.fn(async () => {});
    startSession(OBSIDIAN_SHOWING, notes, "Pale Moon", openNotes);
    await pressStart();
    expect(openNotes).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 12.md");
    expect(create).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 12.md", "");
    expect(getLeaf).not.toHaveBeenCalled();
  });

  it("says the session was made when its page can't be shown", async () => {
    const { notes } = appWith([]);
    const openNotes = vi.fn(async () => {
      throw new Error("No tab");
    });
    startSession(OBSIDIAN_SHOWING, notes, "Pale Moon", openNotes);
    await pressStart();
    expect(Notice.shown).toEqual(["Session 1 was made but couldn't be opened: No tab"]);
  });

  it("shows nothing when the session couldn't be made", async () => {
    const { notes } = appWith([], { createFails: true });
    const openNotes = vi.fn(async () => {});
    startSession(OBSIDIAN_SHOWING, notes, "Pale Moon", openNotes);
    await pressStart();
    expect(Notice.shown).toEqual(["Couldn't start the session: Disk is full"]);
    expect(openNotes).not.toHaveBeenCalled();
  });

  it("asks for a campaign first when there is none", () => {
    const { notes } = appWith([]);
    const openNotes = vi.fn(async () => {});
    startSession(OBSIDIAN_SHOWING, notes, null, openNotes);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });
});
