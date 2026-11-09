import { afterEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { Notice, openedModals } from "../stubs/obsidian";
import { NO_CAMPAIGN } from "../../src/campaign/campaign-folders";
import { startSession } from "../../src/sessions/start-session";

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
  const app = { vault, fileManager, workspace: { getLeaf } } as unknown as App;
  return { app, create, getLeaf };
}

function pressStart(): void {
  const modal = openedModals.at(-1)!;
  Array.from(modal.contentEl.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Start session")!.click();
}

afterEach(() => {
  openedModals.length = 0;
  Notice.shown.length = 0;
});

describe("startSession", () => {
  it("makes the next session and shows it on the Notes page, not in the editor", async () => {
    const { app, create, getLeaf } = appWith(["Pale Moon/Sessions/Session 11.md"]);
    const openNotes = vi.fn(async () => {});
    startSession(app, "Pale Moon", openNotes);
    pressStart();
    await vi.waitFor(() => expect(openNotes).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 12.md"));
    expect(create).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 12.md", "");
    expect(getLeaf).not.toHaveBeenCalled();
  });

  it("says the session was made when its page can't be shown", async () => {
    const { app } = appWith([]);
    const openNotes = vi.fn(async () => {
      throw new Error("No tab");
    });
    startSession(app, "Pale Moon", openNotes);
    pressStart();
    await vi.waitFor(() => expect(Notice.shown).toEqual(["Session 1 was made but couldn't be opened: No tab"]));
  });

  it("shows nothing when the session couldn't be made", async () => {
    const { app } = appWith([], { createFails: true });
    const openNotes = vi.fn(async () => {});
    startSession(app, "Pale Moon", openNotes);
    pressStart();
    await vi.waitFor(() => expect(Notice.shown).toEqual(["Couldn't start the session: Disk is full"]));
    expect(openNotes).not.toHaveBeenCalled();
  });

  it("asks for a campaign first when there is none", () => {
    const { app } = appWith([]);
    const openNotes = vi.fn(async () => {});
    startSession(app, null, openNotes);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });
});
