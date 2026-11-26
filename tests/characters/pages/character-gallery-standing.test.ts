import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { cardStandingOf } from "../../../src/characters/cards/card-standing";
import { BACKUPS, CharacterGallery, FALLEN } from "../../../src/characters/pages/character-gallery";
import type { CharacterNotes } from "../../../src/characters/reading/character-notes";
import { MountedView } from "../../host/showing/mounted-view";
import { FakeNoteVault } from "../../imports/builders/fake-note-vault";
import { STUB_SYNTAX } from "../../host/stub-syntax";

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
  const view = new MountedView();
  const root = view.into;
  const creators = { newCharacter: vi.fn(), importCharacter: vi.fn(), makeMain: vi.fn() };
  const gallery = new CharacterGallery(view, new CampaignStore(new FakeNoteVault().notes.store, STUB_SYNTAX), cardNotes, vi.fn(), creators, STUB_SYNTAX);
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
    const [mira] = root.querySelectorAll<HTMLButtonElement>(".dd-left .dd-make-main");
    mira!.click();
    expect(creators.makeMain).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Mira.md`, expect.any(Function));
    const [, returnFocus] = creators.makeMain.mock.calls[0]!;
    returnFocus();
    expect(root.ownerDocument.activeElement).toBe(mira);
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

describe("leaving play on the Characters page", () => {
  it("offers no Depart on any card, as it is at the bottom of each character's own page", async () => {
    const { root } = await galleryOf("Primary", NOTES, { Brann: "---\nstanding: died\n---\n" });
    expect(root.querySelector(".dd-depart, .dd-died")).toBeNull();
  });

  it("marks a character who departed for something else with the words written for them", async () => {
    const { root } = await galleryOf("Primary", { Primary: "Hand-made.\n" }, { Brann: '---\nstanding: departed\ndeparture: "Joined the Silver Order"\n---\n' });
    expect(textsOf(root, ".dd-fallen .dd-card-standing")).toEqual(["Joined the Silver Order"]);
  });

  it("marks a character who departed as Departed when no words were kept", async () => {
    const { root } = await galleryOf("Primary", { Primary: "Hand-made.\n" }, { Brann: "---\nstanding: departed\n---\n" });
    expect(textsOf(root, ".dd-fallen .dd-card-standing")).toEqual(["Departed"]);
  });

  it("treats a note in Characters marked departed as having left play, with Make main to finish the switch", async () => {
    const { root } = await galleryOf("Primary", { Primary: "Hand-made.\n", Mira: '---\nstanding: departed\ndeparture: "Went home"\n---\n' });
    expect(textsOf(root, ".dd-left .dd-card-standing")).toEqual(["Went home"]);
    expect(textsOf(root, ".dd-left .dd-make-main")).toEqual(["Make main"]);
  });
});

describe("a card's standing", () => {
  it.each([
    ["quoted words", '"Joined the Silver Order: for good"', "Joined the Silver Order: for good"],
    ["words written by hand", "Went home", "Went home"],
    ["quoted blank words", '"  "', null],
    ["broken quotes", '"Went home', null],
    ["a quoted number", '"3"', "3"],
  ])("reads the departure from %s", (_case, value, departure) => {
    expect(cardStandingOf(`---\nstanding: departed\ndeparture: ${value}\n---\n`, STUB_SYNTAX).departure).toBe(departure);
  });

  it("is read from the note's own properties", () => {
    expect(cardStandingOf("---\nstanding: died\nimported-from: pdf\n---\n", STUB_SYNTAX)).toEqual({ standing: "died", imported: true, departure: null });
    expect(cardStandingOf("standing: died\n", STUB_SYNTAX)).toEqual({ standing: null, imported: false, departure: null });
    expect(cardStandingOf("---\nclass: Monk\n---\nstanding: died\n", STUB_SYNTAX)).toEqual({ standing: null, imported: false, departure: null });
    expect(cardStandingOf("---\nstanding:  \r\n---\n", STUB_SYNTAX)).toEqual({ standing: null, imported: false, departure: null });
    expect(cardStandingOf("---\r\nstanding: retired\r\n---\r\n", STUB_SYNTAX)).toEqual({ standing: "retired", imported: false, departure: null });
  });
});
