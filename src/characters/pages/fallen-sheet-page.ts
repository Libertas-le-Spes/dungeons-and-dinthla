import { Component, type TFile } from "obsidian";
import type { LinkActions } from "../../views/lists/linked-text";
import { PendingWork } from "../../views/pending/pending-work";
import type { CharacterSheet, SheetValue } from "../reading/character-sheet";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "../reading/read-character-sheet";
import type { SheetNotes } from "../reading/sheet-notes";
import { leftPlayLinesOf } from "../reading/left-play-lines";
import { modifierOf } from "../reading/sheet-values";
import { addMakeMainButton, type MakeMainAction } from "../cards/make-main-button";
import { couldNotRead, shownTextOf } from "./character-sheet-page";
import { addLeftPlaySection } from "./left-play-section";

type WatchedStore = SheetStore & { subscribe(listener: () => void): () => void };

export interface FallenNeeds {
  readonly store: WatchedStore;
  readonly notes: SheetNotes;
  readonly links: LinkActions;
  readonly makeMain: MakeMainAction;
  leave(): void;
}

interface FallenRead {
  readonly read: ReadSheet;
  readonly lines: string[];
}

function subtitleOf(sheet: CharacterSheet): SheetValue | null {
  for (const value of sheet.values) {
    if (value.name === "subtitle" && value.state !== "unknown") return value;
  }
  return null;
}

function addAbility(parent: HTMLElement, value: SheetValue): void {
  const cell = parent.createDiv({ cls: "dd-sheet-ability" });
  cell.createEl("b", { text: value.label });
  const line = cell.createDiv({ cls: "dd-value-line" });
  const shown = shownTextOf(value);
  line.createSpan({ cls: ["dd-value-read", `dd-state-${value.state}`], text: shown });
  const modifier = modifierOf(shown);
  if (modifier !== "") line.createSpan({ cls: "dd-modifier", text: `(${modifier})` });
}

export class FallenSheetPage extends Component {
  private renders = 0;
  private readonly shownPath: string;
  private readonly drawing = new PendingWork();

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly file: TFile,
    private readonly needs: FallenNeeds,
  ) {
    super();
    this.shownPath = file.path;
  }

  override onload(): void {
    this.register(this.needs.store.subscribe(this.refresh.bind(this)));
    this.register(this.needs.notes.onNoteChanged(this.refreshIfShown.bind(this)));
    this.register(this.needs.notes.onNoteMoved(this.leaveIfMoved.bind(this)));
    this.refresh();
  }

  override onunload(): void {
    this.renders += 1;
    this.contentEl.empty();
  }

  async rendered(): Promise<void> {
    await this.drawing.settled();
  }

  private refresh(): void {
    this.drawing.add(this.render());
  }

  private refreshIfShown(path: string): void {
    if (path === this.shownPath) this.refresh();
  }

  private leaveIfMoved(path: string): void {
    if (path === this.shownPath) this.needs.leave();
  }

  private async readFallen(): Promise<FallenRead> {
    const read = await readCharacterSheet(this.file, this.needs.store, this.needs.notes);
    const text = await this.needs.notes.textOf(this.file);
    return { read, lines: leftPlayLinesOf(text) };
  }

  private async render(): Promise<void> {
    const render = ++this.renders;
    let fallen: FallenRead;
    try {
      fallen = await this.readFallen();
    } catch (error) {
      if (render !== this.renders) return;
      this.drawHead();
      this.contentEl.createEl("p", { cls: "dd-empty", text: couldNotRead(this.file, error) });
      return;
    }
    if (render !== this.renders) return;
    this.draw(fallen);
  }

  private drawHead(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-sheet", "dd-fallen-sheet");
    const head = root.createDiv({ cls: "dd-head" });
    head.createEl("h1", { cls: "dd-sheet-name", text: this.file.basename });
    addMakeMainButton(head.createDiv({ cls: "dd-head-actions" }), this.file.path, this.needs.makeMain);
  }

  private draw(fallen: FallenRead): void {
    const root = this.contentEl;
    const sheet = fallen.read.sheet;
    this.drawHead();
    const subtitle = subtitleOf(sheet);
    if (subtitle !== null) root.createEl("p", { cls: "dd-sheet-subtitle", text: shownTextOf(subtitle) });
    const abilities = root.createDiv({ cls: "dd-sheet-abilities" });
    for (const value of sheet.abilities) addAbility(abilities, value);
    addLeftPlaySection(root, fallen.lines, { sourcePath: this.file.path, actions: this.needs.links });
  }
}
