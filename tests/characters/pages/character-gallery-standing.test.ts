import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { cardStandingOf } from "../../../src/characters/cards/card-standing";
import { BACKUPS, CharacterGallery, FALLEN } from "../../../src/characters/pages/character-gallery";
import type { CharacterNotes } from "../../../src/characters/reading/character-notes";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { FakeNoteVault } from "../../imports/builders/fake-note-vault";

const FOLDER = "D&D/Primary Campaign/Characters";

function stopNothing(): void {
  return;
}

class CardNotes implements CharacterNotes {
  readonly texts = new Map<string, string>();

  constructor(private readonly own: string) {}

  holds(): boolean {
    return true;
  }

  async textOf(file: TFile): Promise<string> {
    const text = this.texts.get(file.path);
    if (text === undefined) throw new Error(`No note at ${file.path}.`);
    return text;
  }

  pathOfLink(): string | null {
    return null;
  }

  isOwnCharacter(file: TFile): boolean {
    return file.basename === this.own;
  }

  campaignFolders(): string[] {
    return [];
  }

  filesIn(): TFile[] {
    return [];
  }

  async sessionsOf(): Promise<SessionNote[]> {
    return [];
  }

  onNoteChanged(): () => void {
    return stopNothing;
  }
}

const FALLEN_FOLDER = "D&D/Primary Campaign/Fallen";

function noteNamed(notes: CardNotes, name: string, text: string, folder: string = FOLDER): TFile {
  const path = `${folder}/${name}.md`;
  notes.texts.set(path, text);
  return { path, basename: name } as TFile;
}

function textsOf(root: HTMLElement, selector: string): string[] {
  const texts: string[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(String(element.textContent));
  return texts;
}

async function galleryOf(own: string, notes: Record<string, string>, fallen: Record<string, string> = {}) {
  const cardNotes = new CardNotes(own);
  const files: TFile[] = [];
  const fallenFiles: TFile[] = [];
  for (const [name, text] of Object.entries(notes)) files.push(noteNamed(cardNotes, name, text));
  for (const [name, text] of Object.entries(fallen)) fallenFiles.push(noteNamed(cardNotes, name, text, FALLEN_FOLDER));
  const root = obsidianDocument().createElement("div");
  const creators = { newCharacter: vi.fn(), importCharacter: vi.fn(), makeMain: vi.fn(), died: vi.fn() };
  const gallery = new CharacterGallery(root, new CampaignStore(new FakeNoteVault().gate), cardNotes, { openRow: vi.fn(), openLink: vi.fn() }, creators);
  gallery.show(files, fallenFiles);
  await gallery.shown();
  return { root, creators, gallery, files, fallenFiles };
}

const NOTES = {
  Aldric: "Hand-made.\n",
  Kept: "---\nimported-from: pdf\n---\n",
  Mira: "---\nimported-from: pdf\nstanding: died\n---\n",
  Primary: "---\nimported-from: pdf\n---\n",
  Spare: "---\nstanding: backup\n---\n",
  Vess: "---\nstanding: retired\n---\n",
};

describe("the Characters page's standings", () => {
  it("shows the main first and marked as yours, and the backups below the others", async () => {
    const { root } = await galleryOf("Primary", NOTES);
    expect(textsOf(root, ":scope > .dd-gallery .dd-stat-block-name")).toEqual(["Primary", "Aldric", "Mira", "Vess"]);
    expect(textsOf(root, ".dd-card-own .dd-stat-block-name")).toEqual(["Primary"]);
    expect(textsOf(root, ".dd-card-own-label")).toEqual(["Your character"]);
    expect(textsOf(root, ".dd-backups .dd-title")).toEqual([BACKUPS]);
    expect(textsOf(root, ".dd-backups .dd-stat-block-name")).toEqual(["Kept", "Spare"]);
  });

  it("marks a note in Characters that says it left play, and gives it Make main to finish a switch that stopped", async () => {
    const { root, creators } = await galleryOf("Primary", NOTES);
    expect(textsOf(root, ".dd-card-standing")).toEqual(["Died", "Retired"]);
    expect(textsOf(root, ".dd-left .dd-make-main")).toEqual(["Make main", "Make main"]);
    for (const button of [...root.querySelectorAll<HTMLButtonElement>(".dd-left .dd-make-main")].slice(0, 1)) button.click();
    expect(creators.makeMain).toHaveBeenCalledWith(`${FOLDER}/Mira.md`, expect.any(Function));
  });

  it("lists those in Fallen in their own list, marked, each with Make main for their own note", async () => {
    const { root, creators } = await galleryOf("Primary", { Primary: "Hand-made.\n" }, { Brann: "---\nstanding: died\n---\n", Isolde: "---\nstanding: retired\n---\n" });
    expect(textsOf(root, ".dd-fallen .dd-title")).toEqual([`${FALLEN}2`]);
    expect(textsOf(root, ".dd-fallen .dd-stat-block-name")).toEqual(["Brann", "Isolde"]);
    expect(textsOf(root, ".dd-fallen .dd-card-standing")).toEqual(["Died", "Retired"]);
    expect(textsOf(root, ":scope > .dd-gallery .dd-stat-block-name")).toEqual(["Primary"]);
    const buttons = root.querySelectorAll<HTMLButtonElement>(".dd-fallen .dd-make-main");
    expect(buttons).toHaveLength(2);
    for (const button of [...buttons].slice(1)) button.click();
    expect(creators.makeMain).toHaveBeenCalledWith(`${FALLEN_FOLDER}/Isolde.md`, expect.any(Function));
  });

  it("shows no Fallen list when nobody is in Fallen, and still lists Fallen when nobody is in Characters", async () => {
    const none = await galleryOf("Primary", { Primary: "Hand-made.\n" });
    expect(none.root.querySelector(".dd-fallen")).toBeNull();
    const only = await galleryOf("Primary", {}, { Brann: "---\nstanding: died\n---\n" });
    expect(textsOf(only.root, ".dd-empty")).toEqual(["No characters yet. Add one with New character."]);
    expect(textsOf(only.root, ".dd-fallen .dd-stat-block-name")).toEqual(["Brann"]);
  });

  it("gives each backup a Make main button for its own note", async () => {
    const { root, creators } = await galleryOf("Primary", NOTES);
    expect(textsOf(root, ".dd-backup .dd-make-main")).toEqual(["Make main", "Make main"]);
    const buttons = root.querySelectorAll<HTMLButtonElement>(".dd-backup .dd-make-main");
    for (const button of buttons) button.click();
    expect(creators.makeMain).toHaveBeenCalledTimes(2);
    expect(creators.makeMain).toHaveBeenNthCalledWith(2, `${FOLDER}/Spare.md`, expect.any(Function));
  });

  it("shows no backups heading when nobody is kept ready", async () => {
    const { root } = await galleryOf("Primary", { Primary: "---\nimported-from: pdf\n---\n", Aldric: "" });
    expect(root.querySelector(".dd-backups")).toBeNull();
  });

  it("keeps the main as main even when their note says backup", async () => {
    const { root } = await galleryOf("Spare", { Spare: "---\nstanding: backup\n---\n" });
    expect(root.querySelector(".dd-backups")).toBeNull();
  });
});

describe("the Died button on the Characters page", () => {
  it("is on each card of a character in play and each backup, in Obsidian's warning style", async () => {
    const { root } = await galleryOf("Primary", NOTES);
    expect(textsOf(root, ".dd-played .dd-died")).toEqual(["Died", "Died"]);
    expect(textsOf(root, ".dd-backup .dd-died")).toEqual(["Died", "Died"]);
    for (const button of root.querySelectorAll(".dd-died")) expect(button.classList.contains("mod-warning")).toBe(true);
  });

  it("is not on a card in Fallen, nor on a note in Characters that already says it left play", async () => {
    const { root } = await galleryOf("Primary", NOTES, { Brann: "---\nstanding: died\n---\n" });
    expect(root.querySelector(".dd-fallen .dd-died")).toBeNull();
    expect(root.querySelector(".dd-left .dd-died")).toBeNull();
  });

  it("asks once about that card's note, handing a way back", async () => {
    const { root, creators } = await galleryOf("Primary", NOTES);
    const buttons = root.querySelectorAll<HTMLButtonElement>(".dd-played .dd-died");
    for (const button of [...buttons].slice(1, 2)) button.click();
    expect(creators.died).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Aldric.md`, expect.any(Function));
  });

  it("asks about a backup's own note too", async () => {
    const { root, creators } = await galleryOf("Primary", NOTES);
    for (const button of [...root.querySelectorAll<HTMLButtonElement>(".dd-backup .dd-died")].slice(1)) button.click();
    expect(creators.died).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Spare.md`, expect.any(Function));
  });

  it("puts focus back on the button when the dialog closes, and on New character when the page redraws just after", async () => {
    const { root, creators, gallery, files, fallenFiles } = await galleryOf("Primary", NOTES);
    root.ownerDocument.body.append(root);
    const button = root.querySelector<HTMLButtonElement>(".dd-played .dd-died");
    if (button === null) throw new Error("No Died button.");
    button.click();
    const returnFocus = vi.mocked(creators.died).mock.calls[0]?.[1];
    if (returnFocus === undefined) throw new Error("Died was not asked.");
    returnFocus();
    expect(root.ownerDocument.activeElement).toBe(button);
    gallery.show(files, fallenFiles);
    await gallery.shown();
    expect(root.ownerDocument.activeElement).toBe(root.querySelector(".dd-head .dd-create"));
  });

  it("leaves focus alone when the page redraws and Died was never pressed", async () => {
    const { root, gallery, files, fallenFiles } = await galleryOf("Primary", NOTES);
    root.ownerDocument.body.append(root);
    gallery.show(files, fallenFiles);
    await gallery.shown();
    expect(root.ownerDocument.activeElement).not.toBe(root.querySelector(".dd-head .dd-create"));
  });
});

describe("a card's standing", () => {
  it("is read from the note's own properties", () => {
    expect(cardStandingOf("---\nstanding: died\nimported-from: pdf\n---\n")).toEqual({ standing: "died", imported: true });
    expect(cardStandingOf("standing: died\n")).toEqual({ standing: null, imported: false });
    expect(cardStandingOf("---\nclass: Monk\n---\nstanding: died\n")).toEqual({ standing: null, imported: false });
    expect(cardStandingOf("---\nstanding:  \r\n---\n")).toEqual({ standing: null, imported: false });
    expect(cardStandingOf("---\r\nstanding: retired\r\n---\r\n")).toEqual({ standing: "retired", imported: false });
  });
});
