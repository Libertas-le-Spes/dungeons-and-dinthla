import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { cardStandingOf } from "../../../src/characters/cards/card-standing";
import { BACKUPS, CharacterGallery } from "../../../src/characters/pages/character-gallery";
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

function noteNamed(notes: CardNotes, name: string, text: string): TFile {
  const path = `${FOLDER}/${name}.md`;
  notes.texts.set(path, text);
  return { path, basename: name } as TFile;
}

function textsOf(root: HTMLElement, selector: string): string[] {
  const texts: string[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(String(element.textContent));
  return texts;
}

async function galleryOf(own: string, notes: Record<string, string>) {
  const cardNotes = new CardNotes(own);
  const files: TFile[] = [];
  for (const [name, text] of Object.entries(notes)) files.push(noteNamed(cardNotes, name, text));
  const root = obsidianDocument().createElement("div");
  const creators = { newCharacter: vi.fn(), importCharacter: vi.fn(), makeMain: vi.fn() };
  const gallery = new CharacterGallery(root, new CampaignStore(new FakeNoteVault().gate), cardNotes, { openRow: vi.fn(), openLink: vi.fn() }, creators);
  gallery.show(files);
  await gallery.shown();
  return { root, creators };
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
  it("shows the main first, those who left play with the others, marked, and the backups at the very bottom", async () => {
    const { root } = await galleryOf("Primary", NOTES);
    expect(textsOf(root, ":scope > .dd-gallery .dd-stat-block-name")).toEqual(["Primary", "Aldric", "Mira", "Vess"]);
    expect(textsOf(root, ".dd-card-standing")).toEqual(["Died", "Retired"]);
    expect(textsOf(root, ".dd-backups .dd-title")).toEqual([BACKUPS]);
    expect(textsOf(root, ".dd-backups .dd-stat-block-name")).toEqual(["Kept", "Spare"]);
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

describe("a card's standing", () => {
  it("is read from the note's own properties", () => {
    expect(cardStandingOf("---\nstanding: died\nimported-from: pdf\n---\n")).toEqual({ standing: "died", imported: true });
    expect(cardStandingOf("standing: died\n")).toEqual({ standing: null, imported: false });
  });
});
