import { VALUE_BUTTONS } from "../../views/lists/row-keys";
import { Component } from "obsidian";
import type { NoteRef } from "../../host/notes/note-ref";
import type { Source } from "../../campaign/record/campaign";
import { campaignFolderOf, charactersFolderOf } from "../../campaign/paths/campaign-folders";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import type { LinkActions } from "../../views/lists/linked-text";
import { FocusAfter } from "../../views/lists/focus-after";
import { PENDING_FOCUS_MS } from "../../views/lists/row-focus";
import { NOT_KNOWN, shownValuesOf, type CharacterSheet, type SheetValue, type ValueState } from "../reading/character-sheet";
import { messageOf } from "../../views/dialogs/message-of";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "../reading/read-character-sheet";
import type { MentionNotes } from "../reading/mention-notes";
import { MentionsPanel } from "./mentions-panel";
import type { SheetNotes } from "../reading/sheet-notes";
import { modifierOf } from "../reading/sheet-values";
import { fillStatBlock } from "../cards/stat-block";
import { PendingWork } from "../../views/pending/pending-work";
import { isCharacterNotePath } from "../../campaign/paths/character-note-path";
import { addDepartButton } from "../cards/depart-button";
import { addUpdateButton } from "../imported/drawing/update-button";
import { addImportedPanels } from "../imported/panels/imported-panels";
import type { ItemTracking } from "../imported/tracking/item-tracking";

export const TAP_A_VALUE = "Tap a value to change it or its state.";

export const STATE_WORDS: Record<ValueState, string> = {
  learned: "Learned at the table",
  override: "Override",
  imported: "Imported",
  carried: "Carried over",
  unknown: "Not known yet",
};

export interface SheetActions extends LinkActions {
  editCharacter(file: NoteRef): void;
  updateFromBeyond(file: NoteRef, returnFocus: () => void): void;
  depart(path: string, returnFocus: () => void): void;
  chooseValue(file: NoteRef, value: SheetValue, onClosed: () => void): void;
  readonly tracking: ItemTracking;
}

type WatchedStore = SheetStore & { subscribe(listener: () => void): () => void };

export function shownTextOf(value: SheetValue): string {
  if (value.shown === null) return NOT_KNOWN;
  return value.shown.value;
}

interface Caption {
  readonly text: string;
  readonly source: Source;
}

function captionOf(value: SheetValue): Caption | null {
  const shown = value.shown;
  if (shown === null) return null;
  if (value.state === "learned") return { text: sessionLabelOf(shown.source.path), source: shown.source };
  if (value.state === "carried" && value.carriedCampaign !== null) return { text: `Carried from ${value.carriedCampaign}`, source: shown.source };
  return null;
}

export function couldNotRead(file: NoteRef, error: unknown): string {
  return `Couldn't read ${file.basename}'s sheet: ${messageOf(error)}`;
}

function earlierText(count: number): string {
  if (count === 1) return "1 earlier value";
  return `${count} earlier values`;
}

export class CharacterSheetPage extends Component {
  private renders = 0;
  private watched: string[] = [];
  private pendingFocus: { name: string; until: number } | null = null;
  private readonly focusEdit = new FocusAfter();
  private readonly drawing = new PendingWork();
  private readonly mentions: MentionsPanel;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly file: NoteRef,
    private readonly store: WatchedStore,
    private readonly notes: SheetNotes,
    private readonly actions: SheetActions,
    mentionNotes: MentionNotes,
  ) {
    super();
    this.mentions = new MentionsPanel(mentionNotes, actions);
  }

  override onload(): void {
    this.register(this.store.subscribe(() => this.refresh()));
    const refreshIfWatched = (path: string) => {
      if (this.watches(path)) this.refresh();
    };
    this.register(this.notes.onNoteChanged(refreshIfWatched));
    this.register(this.notes.onNoteMoved(refreshIfWatched));
    this.register(this.mentions.watch());
    this.refresh();
  }

  override onunload(): void {
    this.renders += 1;
    this.mentions.clear();
    this.contentEl.empty();
  }

  async rendered(): Promise<void> {
    await this.drawing.settled();
    await this.mentions.readSettled();
  }

  private refresh(): void {
    this.drawing.add(this.render(this.file));
  }

  private watches(path: string): boolean {
    return this.watched.some((watched) => path === watched || path.startsWith(`${watched}/`));
  }

  private async render(file: NoteRef): Promise<void> {
    const render = ++this.renders;
    let read: ReadSheet;
    try {
      read = await readCharacterSheet(file, this.store, this.notes);
    } catch (error) {
      if (render !== this.renders) return;
      this.watched = this.watchedAlso(this.characterPaths(file));
      this.drawError(file, error);
      return;
    }
    if (render !== this.renders) return;
    const watched = [file.path];
    if (read.campaignFolder !== null) watched.push(read.campaignFolder);
    if (read.carriedPath !== null) watched.push(read.carriedPath);
    if (read.carriedCampaignFolder !== null) watched.push(read.carriedCampaignFolder);
    this.watched = watched;
    this.draw(file, read);
  }

  private characterPaths(file: NoteRef): string[] {
    const paths = [file.path];
    const campaignFolder = campaignFolderOf(file.path, this.notes.campaignFolders());
    if (campaignFolder !== null) paths.push(campaignFolder);
    return paths;
  }

  private watchedAlso(paths: string[]): string[] {
    return [...this.watched, ...paths.filter((path) => !this.watched.includes(path))];
  }

  private drawError(file: NoteRef, error: unknown): void {
    this.mentions.clear();
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-sheet");
    root.createEl("h1", { cls: "dd-sheet-name", text: file.basename });
    root.createEl("p", { cls: "dd-empty", text: couldNotRead(file, error) });
  }

  private draw(file: NoteRef, read: ReadSheet): void {
    const sheet = read.sheet;
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-sheet");
    const head = root.createDiv({ cls: "dd-head" });
    head.createEl("h1", { cls: "dd-sheet-name", text: file.basename });
    const actions = head.createDiv({ cls: "dd-head-actions" });
    const edit = actions.createEl("button", { cls: "dd-create", text: "Edit character" });
    edit.addEventListener("click", () => this.actions.editCharacter(file));
    if (this.focusEdit.isArmed()) edit.focus();
    if (this.isUpdatable(file, read.campaignFolder)) {
      addUpdateButton(actions, file, this.actions);
    }
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
    addImportedPanels(root, file, read.lists, this.actions.tracking);
    this.drawStatBlock(root, file, sheet);
    this.mentions.draw(root.createEl("section", { cls: "dd-sheet-mentions" }), file);
    if (this.isUpdatable(file, read.campaignFolder)) {
      addDepartButton({ parent: root.createDiv({ cls: "dd-sheet-depart" }), path: file.path, action: this.actions, focus: this.focusEdit });
    }
    this.focusPending();
  }

  private isUpdatable(file: NoteRef, campaignFolder: string | null): boolean {
    if (campaignFolder === null) return false;
    return isCharacterNotePath(file.path, charactersFolderOf(campaignFolder));
  }

  private drawStatBlock(root: HTMLElement, file: NoteRef, sheet: CharacterSheet): void {
    const section = root.createEl("section", { cls: "dd-sheet-stat-block" });
    section.createEl("h2", { cls: "dd-title", text: "Stat block" });
    fillStatBlock(section.createDiv(), file.basename, shownValuesOf(sheet));
  }

  private addValue(parent: HTMLElement, file: NoteRef, value: SheetValue, isAbility: boolean): void {
    const line = parent.createDiv({ cls: "dd-value-line" });
    const shownText = shownTextOf(value);
    const button = line.createEl("button", {
      cls: ["dd-value", `dd-state-${value.state}`],
      text: shownText,
      attr: { "data-name": value.name, "aria-label": `${value.label}: ${shownText}, ${STATE_WORDS[value.state]}` },
    });
    VALUE_BUTTONS.mark(button, value.name);
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
    const caption = captionOf(value);
    if (caption === null) return;
    const where = parent.createDiv({ cls: ["dd-value-source", `dd-state-${value.state}`] });
    this.addSourceLink(where, caption.text, caption.source);
  }

  private addSourceLink(parent: HTMLElement, text: string, source: Source): void {
    const link = parent.createEl("a", { cls: "dd-source-link", text, href: "#" });
    link.addEventListener("click", (event) => {
      event.preventDefault();
      this.actions.openRow(source);
    });
  }

  private choose(file: NoteRef, value: SheetValue): void {
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
      (candidate) => VALUE_BUTTONS.keyOf(candidate) === pending.name,
    );
    if (button !== undefined) button.focus();
  }
}
