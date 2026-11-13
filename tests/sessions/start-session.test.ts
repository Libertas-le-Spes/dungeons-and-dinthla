import { afterEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { Notice, openedModals } from "../stubs/obsidian";
import { NO_CAMPAIGN } from "../../src/campaign/paths/campaign-folders";
import { startSession } from "../../src/sessions/start-session";
import { NewSessionModal } from "../../src/sessions/new-session-modal";
import type { Gate } from "../../src/fence/gate/gatekeeper";

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
  const gate = { files: vault, fileActions: fileManager } as unknown as Gate;
  return { app, gate, create, getLeaf };
}

function startDialog(): NewSessionModal {
  let opened: NewSessionModal | null = null;
  for (const modal of openedModals) {
    if (modal instanceof NewSessionModal) opened = modal;
  }
  if (opened === null) throw new Error("No Start session dialog is open.");
  return opened;
}

async function pressStart(): Promise<void> {
  const modal = startDialog();
  Array.from(modal.contentEl.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Start session")!.click();
  await modal.startSettled();
}

afterEach(() => {
  openedModals.length = 0;
  Notice.shown.length = 0;
});

describe("startSession", () => {
  it("makes the next session and shows it on the Notes page, not in the editor", async () => {
    const { app, gate, create, getLeaf } = appWith(["Pale Moon/Sessions/Session 11.md"]);
    const openNotes = vi.fn(async () => {});
    startSession(app, gate, "Pale Moon", openNotes);
    await pressStart();
    expect(openNotes).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 12.md");
    expect(create).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 12.md", "");
    expect(getLeaf).not.toHaveBeenCalled();
  });

  it("says the session was made when its page can't be shown", async () => {
    const { app, gate } = appWith([]);
    const openNotes = vi.fn(async () => {
      throw new Error("No tab");
    });
    startSession(app, gate, "Pale Moon", openNotes);
    await pressStart();
    expect(Notice.shown).toEqual(["Session 1 was made but couldn't be opened: No tab"]);
  });

  it("shows nothing when the session couldn't be made", async () => {
    const { app, gate } = appWith([], { createFails: true });
    const openNotes = vi.fn(async () => {});
    startSession(app, gate, "Pale Moon", openNotes);
    await pressStart();
    expect(Notice.shown).toEqual(["Couldn't start the session: Disk is full"]);
    expect(openNotes).not.toHaveBeenCalled();
  });

  it("asks for a campaign first when there is none", () => {
    const { app, gate } = appWith([]);
    const openNotes = vi.fn(async () => {});
    startSession(app, gate, null, openNotes);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });
});
