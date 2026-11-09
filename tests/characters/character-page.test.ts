import { describe, expect, it, vi } from "vitest";
import { Component, type TFile } from "obsidian";
import { ALL_CHARACTERS, CharacterPage } from "../../src/characters/character-page";
import { obsidianDocument } from "../views/obsidian-dom";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;

class FakeSheet extends Component {
  loaded = false;

  constructor(
    readonly contentEl: HTMLElement,
    readonly file: TFile,
  ) {
    super();
  }

  override onload(): void {
    this.loaded = true;
    this.contentEl.setText(`sheet of ${this.file.basename}`);
  }

  override onunload(): void {
    this.loaded = false;
  }
}

function openPage() {
  const root = obsidianDocument().createElement("div");
  root.createDiv({ text: "left from the page before" });
  const sheets: FakeSheet[] = [];
  const makeSheet = (contentEl: HTMLElement, file: TFile) => {
    const sheet = new FakeSheet(contentEl, file);
    sheets.push(sheet);
    return sheet;
  };
  const showGallery = vi.fn();
  const page = new CharacterPage(root, MIRA, makeSheet, showGallery);
  page.load();
  return { root, page, sheets, showGallery };
}

describe("CharacterPage", () => {
  it("shows a way back to all characters above the character's sheet", () => {
    const { root, sheets } = openPage();
    expect([...root.children].map((child) => child.textContent)).toEqual([ALL_CHARACTERS, "sheet of Mira"]);
    expect(ALL_CHARACTERS).toBe("← All characters");
    expect(sheets.map((sheet) => [sheet.file, sheet.loaded])).toEqual([[MIRA, true]]);
  });

  it("shows the gallery when the way back is pressed", () => {
    const { root, showGallery } = openPage();
    root.querySelector<HTMLElement>(".dd-back")!.click();
    expect(showGallery).toHaveBeenCalledOnce();
  });

  it("closes the sheet when it is closed", () => {
    const { page, sheets } = openPage();
    page.unload();
    expect(sheets[0]!.loaded).toBe(false);
  });
});
