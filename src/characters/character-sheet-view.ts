import { FileView, type TFile, type WorkspaceLeaf } from "obsidian";
import type { Source } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import type { LinkActions } from "../views/linked-text";
import { PENDING_FOCUS_MS } from "../views/row-focus";
import { NOT_KNOWN, type CharacterSheet, type SheetValue, type ValueState } from "./character-sheet";
import { readCharacterSheet, type SheetStore } from "./read-character-sheet";
import type { SheetNotes } from "./sheet-notes";
import { modifierOf } from "./sheet-values";

export const CHARACTER_SHEET_VIEW = "dungeons-and-dinthla-character-sheet";

export const TAP_A_VALUE = "Tap a value to change it or its state.";

export const STATE_WORDS: Record<ValueState, string> = {
  learned: "Learned at the table",
  override: "Override",
  carried: "Carried over",
  unknown: "Not known yet",
};

export interface SheetActions extends LinkActions {
  editCharacter(file: TFile): void;
  chooseValue(file: TFile, value: SheetValue, onClosed: () => void): void;
}

type WatchedStore = SheetStore & { subscribe(listener: () => void): () => void };

export function shownTextOf(value: SheetValue): string {
  if (value.shown === null) return NOT_KNOWN;
  return value.shown.value;
}

function sourceTextOf(value: SheetValue): string {
  if (value.state === "learned" && value.shown !== null) return sessionLabelOf(value.shown.source.path);
  if (value.state === "carried" && value.carriedCampaign !== null) return `Carried from ${value.carriedCampaign}`;
  return STATE_WORDS[value.state];
}

function earlierText(count: number): string {
  if (count === 1) return "1 earlier value";
  return `${count} earlier values`;
}

export class CharacterSheetView extends FileView {
  private renders = 0;
  private watched: string[] = [];
  private pendingFocus: { name: string; until: number } | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: WatchedStore,
    private readonly notes: SheetNotes,
    private readonly actions: SheetActions,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return CHARACTER_SHEET_VIEW;
  }

  override getIcon(): string {
    return "user";
  }

  override onload(): void {
    super.onload();
    this.register(this.store.subscribe(() => this.refresh()));
    this.register(
      this.notes.onNoteChanged((path) => {
        if (this.watches(path)) this.refresh();
      }),
    );
  }

  override async onLoadFile(file: TFile): Promise<void> {
    await this.render(file);
  }

  override async onUnloadFile(): Promise<void> {
    this.renders += 1;
    this.contentEl.empty();
  }

  override async onRename(file: TFile): Promise<void> {
    await super.onRename(file);
    await this.render(file);
  }

  private refresh(): void {
    if (this.file !== null) void this.render(this.file);
  }

  private watches(path: string): boolean {
    return this.watched.some((watched) => path === watched || path.startsWith(`${watched}/`));
  }

  private async render(file: TFile): Promise<void> {
    const render = ++this.renders;
    const read = await readCharacterSheet(file, this.store, this.notes);
    if (render !== this.renders) return;
    const watched = [file.path];
    if (read.campaignFolder !== null) watched.push(read.campaignFolder);
    if (read.carriedPath !== null) watched.push(read.carriedPath);
    this.watched = watched;
    this.draw(file, read.sheet);
  }

  private draw(file: TFile, sheet: CharacterSheet): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-sheet");
    const head = root.createDiv({ cls: "dd-head" });
    head.createEl("h1", { cls: "dd-sheet-name", text: file.basename });
    const edit = head.createEl("button", { cls: "dd-create", text: "Edit character" });
    edit.addEventListener("click", () => this.actions.editCharacter(file));
    const subtitle = sheet.values.find((value) => value.name === "subtitle");
    if (subtitle !== undefined && subtitle.state !== "unknown") root.createEl("p", { cls: "dd-sheet-subtitle", text: shownTextOf(subtitle) });
    const abilities = root.createDiv({ cls: "dd-sheet-abilities" });
    for (const value of sheet.abilities) {
      const cell = abilities.createDiv({ cls: "dd-sheet-ability" });
      cell.createEl("b", { text: value.label });
      this.addValue(cell, file, value, true);
    }
    const rows = root.createEl("ul", { cls: "dd-sheet-rows" });
    for (const value of sheet.values) {
      const row = rows.createEl("li", { cls: "dd-sheet-row" });
      row.createSpan({ cls: "dd-sheet-label", text: value.label });
      this.addValue(row.createDiv({ cls: "dd-sheet-value" }), file, value, false);
    }
    root.createEl("p", { cls: "dd-sheet-hint", text: TAP_A_VALUE });
    this.focusPending();
  }

  private addValue(parent: HTMLElement, file: TFile, value: SheetValue, isAbility: boolean): void {
    const line = parent.createDiv({ cls: "dd-value-line" });
    const shownText = shownTextOf(value);
    const button = line.createEl("button", {
      cls: ["dd-value", `dd-state-${value.state}`],
      text: shownText,
      attr: { "data-name": value.name, "aria-label": `${value.label}: ${shownText}, ${STATE_WORDS[value.state]}` },
    });
    button.addEventListener("click", () => this.choose(file, value));
    if (isAbility) {
      const modifier = modifierOf(shownText);
      if (modifier !== "") line.createSpan({ cls: "dd-modifier", text: `(${modifier})` });
    }
    if (value.earlier.length > 0) {
      const count = value.earlier.length;
      line.createSpan({ cls: "dd-earlier", text: `↺ ${count}`, attr: { "aria-label": earlierText(count), title: earlierText(count) } });
    }
    this.addSource(parent, value);
  }

  private addSource(parent: HTMLElement, value: SheetValue): void {
    const where = parent.createDiv({ cls: ["dd-value-source", `dd-state-${value.state}`] });
    const shown = value.shown;
    if (shown === null) {
      where.setText(sourceTextOf(value));
      return;
    }
    this.addSourceLink(where, sourceTextOf(value), shown.source);
  }

  private addSourceLink(parent: HTMLElement, text: string, source: Source): void {
    const link = parent.createEl("a", { cls: "dd-source-link", text, href: "#" });
    link.addEventListener("click", (event) => {
      event.preventDefault();
      this.actions.openRow(source);
    });
  }

  private choose(file: TFile, value: SheetValue): void {
    this.actions.chooseValue(file, value, () => {
      this.pendingFocus = { name: value.name, until: Date.now() + PENDING_FOCUS_MS };
      this.focusPending();
    });
  }

  private focusPending(): void {
    const pending = this.pendingFocus;
    if (pending === null) return;
    if (Date.now() > pending.until) {
      this.pendingFocus = null;
      return;
    }
    const button = Array.from(this.contentEl.querySelectorAll<HTMLElement>(".dd-value")).find(
      (candidate) => candidate.dataset.name === pending.name,
    );
    if (button !== undefined) button.focus();
  }
}
