import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { CastPage } from "../../src/characters/cast-page";
import type { CharacterNotes } from "../../src/characters/character-notes";
import { obsidianDocument } from "../views/obsidian-dom";

function fileOf(name: string): TFile {
  return { path: `Pale Moon/Characters/${name}.md`, basename: name } as TFile;
}

function openCast({ folder = "Pale Moon" as string | null, characters = ["Mira", "Thessaly"], own = "" } = {}) {
  let campaignChanged = () => {};
  let noteChanged: (path: string) => void = () => {};
  let fileChanged: (path: string) => void = () => {};
  const unsubscribe = vi.fn();
  const stopWatchingNotes = vi.fn();
  const stopWatchingFiles = vi.fn();
  const store = {
    campaignFolder: folder,
    sessionNotes: [],
    subscribe: (next: () => void) => {
      campaignChanged = next;
      return unsubscribe;
    },
  };
  const shown = { names: characters };
  const filesIn = vi.fn(() => shown.names.map(fileOf));
  const notes: CharacterNotes = {
    textOf: async () => "",
    pathOfLink: () => null,
    isOwnCharacter: (file) => file.basename === own,
    campaignFolders: () => ["Pale Moon"],
    filesIn,
    sessionsOf: async () => [],
    onNoteChanged: (changed) => {
      noteChanged = changed;
      return stopWatchingNotes;
    },
  };
  const watchFiles = (changed: (path: string) => void) => {
    fileChanged = changed;
    return stopWatchingFiles;
  };
  const root = obsidianDocument().createElement("div");
  const page = new CastPage(root, store as unknown as CampaignStore, notes, { openRow: vi.fn(), openLink: vi.fn() }, vi.fn(), watchFiles);
  page.load();
  return {
    root,
    page,
    store,
    shown,
    filesIn,
    unsubscribe,
    stopWatchingNotes,
    stopWatchingFiles,
    campaignChanged: () => campaignChanged(),
    noteChanged: (path: string) => noteChanged(path),
    fileChanged: (path: string) => fileChanged(path),
  };
}

function names(root: HTMLElement): string[] {
  return [...root.querySelectorAll(".dd-gallery .dd-stat-block-name")].map((name) => name.textContent!);
}

async function shownNames(root: HTMLElement, expected: string[]): Promise<void> {
  await vi.waitFor(() => expect(names(root)).toEqual(expected));
}

describe("CastPage", () => {
  it("shows the cards of the open campaign's characters", async () => {
    const { root, filesIn } = openCast();
    await shownNames(root, ["Mira", "Thessaly"]);
    expect(filesIn).toHaveBeenCalledWith("Pale Moon");
  });

  it("shows the player's own character first, and the others in the order the Characters folder lists them", async () => {
    const { root } = openCast({ characters: ["Brother Aldric", "Lady Vess", "Mira", "Thessaly"], own: "Lady Vess" });
    await shownNames(root, ["Lady Vess", "Brother Aldric", "Mira", "Thessaly"]);
  });

  it("says there are no characters when no campaign is open", async () => {
    const { root, filesIn } = openCast({ folder: null });
    await vi.waitFor(() => expect(root.querySelector(".dd-empty")?.textContent).toBe("No characters yet. Add one with New character."));
    expect(filesIn).not.toHaveBeenCalled();
  });

  it("shows a character added to the campaign's Characters folder", async () => {
    const { root, shown, fileChanged } = openCast();
    await shownNames(root, ["Mira", "Thessaly"]);
    shown.names = ["Brother Aldric", "Mira", "Thessaly"];
    fileChanged("Pale Moon/Characters/Brother Aldric.md");
    await shownNames(root, ["Brother Aldric", "Mira", "Thessaly"]);
  });

  it("reads the cards again when the campaign note changes", async () => {
    const { root, filesIn, noteChanged } = openCast();
    await shownNames(root, ["Mira", "Thessaly"]);
    noteChanged("Pale Moon/Pale Moon.md");
    expect(filesIn).toHaveBeenCalledTimes(2);
  });

  it("leaves the cards alone when a note outside the Characters folder changes", async () => {
    const { root, filesIn, noteChanged, fileChanged } = openCast();
    await shownNames(root, ["Mira", "Thessaly"]);
    noteChanged("Pale Moon/Sessions/Session 1.md");
    fileChanged("Ashen Road/Characters/Old Tom.md");
    expect(filesIn).toHaveBeenCalledOnce();
  });

  it("reads the cards again when the campaign changes", async () => {
    const { root, filesIn, campaignChanged } = openCast();
    await shownNames(root, ["Mira", "Thessaly"]);
    campaignChanged();
    expect(filesIn).toHaveBeenCalledTimes(2);
  });

  it("stops listening when it is closed", () => {
    const { page, unsubscribe, stopWatchingNotes, stopWatchingFiles } = openCast();
    page.unload();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(stopWatchingNotes).toHaveBeenCalledOnce();
    expect(stopWatchingFiles).toHaveBeenCalledOnce();
  });
});
