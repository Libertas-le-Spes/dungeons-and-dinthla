import type { NoteRef } from "../../host/notes/note-ref";
import type { Source } from "../../campaign/record/campaign";
import { campaignFolderOf, charactersFolderOf } from "../../campaign/paths/campaign-folders";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { FocusAfter } from "../../views/lists/focus-after";
import { PENDING_FOCUS_MS } from "../../views/lists/row-focus";
import { shownValuesOf, type CharacterSheet, type SheetValue } from "../reading/character-sheet";
import { shownTextOf, STATE_WORDS } from "../reading/sheet-value-words";
import { messageOf } from "../../views/dialogs/message-of";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "../reading/read-character-sheet";
import type { MentionNotes } from "../reading/mention-notes";
import { MentionsPanel, type MentionActions } from "./mentions-panel";
import type { SheetNotes } from "../reading/sheet-notes";
import { modifierOf } from "../reading/sheet-values";
import { STAT_BLOCK_CLASS, StatBlock } from "../cards/drawing/stat-block";
import { PendingWork } from "../../views/pending/pending-work";
import { isCharacterNotePath } from "../../campaign/paths/character-note-path";
import { departButton } from "../cards/drawing/depart-button";
import { updateButton } from "../imported/drawing/update-button";
import { importedPanels } from "../imported/panels/imported-panels";
import type { ItemTracking } from "../imported/tracking/item-tracking";
import type { Pauses } from "../../host/keeping/pauses";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Anchor, Bold, Button, Div, Heading1, Heading2, List, ListItem, Paragraph, Section, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { PagePart } from "../../views/pages/page-part";

export const TAP_A_VALUE = "Tap a value to change it or its state.";

export interface SheetActions extends MentionActions {
  editCharacter(file: NoteRef): void;
  updateFromBeyond(file: NoteRef, returnFocus: () => void): void;
  depart(path: string, returnFocus: () => void): void;
  chooseValue(file: NoteRef, value: SheetValue, onClosed: () => void): void;
  readonly tracking: ItemTracking;
}

type WatchedStore = SheetStore & { subscribe(listener: () => void): () => void };

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

const SHEET_CLASSES = ["dd-tokens", "dd-root", "dd-list-view", "dd-sheet"];

export interface SheetParts {
  readonly file: NoteRef;
  readonly store: WatchedStore;
  readonly notes: SheetNotes;
  readonly actions: SheetActions;
  readonly mentionNotes: MentionNotes;
  readonly pauses: Pauses;
}

function valueClasses(value: SheetValue, first: string): string[] {
  return [first, `dd-state-${value.state}`];
}

export class CharacterSheetPage implements PagePart {
  private renders = 0;
  private watched: string[] = [];
  private pendingFocus: { name: string; until: number } | null = null;
  private readonly focusEdit = new FocusAfter();
  private readonly drawing = new PendingWork();
  private readonly mentions: MentionsPanel;
  private readonly place = new KeptHandle();
  private readonly editButton = new KeptHandle();
  private readonly valueButtons = new Map<string, KeptHandle>();
  private readonly stops: (() => void)[] = [];
  private readonly file: NoteRef;
  private readonly store: WatchedStore;
  private readonly notes: SheetNotes;
  private readonly actions: SheetActions;

  constructor(
    parts: SheetParts,
    private readonly syntax: PropertiesSyntax,
  ) {
    this.file = parts.file;
    this.store = parts.store;
    this.notes = parts.notes;
    this.actions = parts.actions;
    this.mentions = new MentionsPanel(parts.mentionNotes, parts.actions, parts.pauses);
  }

  tree(): ViewElement {
    return new Div({ cls: SHEET_CLASSES, bindings: [new HandleRequest(this.place)] });
  }

  started(): void {
    this.stops.push(this.store.subscribe(this.refresh.bind(this)));
    this.stops.push(this.notes.onNoteChanged(this.refreshIfWatched.bind(this)));
    this.stops.push(this.notes.onNoteMoved(this.refreshIfWatched.bind(this)));
    this.stops.push(this.mentions.watch());
    this.refresh();
  }

  stopped(): void {
    this.renders += 1;
    this.mentions.clear();
    for (const stop of this.stops) stop();
    this.stops.length = 0;
    this.place.showInside([]);
  }

  async rendered(): Promise<void> {
    await this.drawing.settled();
    await this.mentions.readSettled();
  }

  private refreshIfWatched(path: string): void {
    if (this.watches(path)) this.refresh();
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
      read = await readCharacterSheet(file, this.store, this.notes, this.syntax);
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
    this.valueButtons.clear();
    this.place.showInside([new Heading1({ cls: ["dd-sheet-name"], text: file.basename }), new Paragraph({ cls: ["dd-empty"], text: couldNotRead(file, error) })]);
  }

  private draw(file: NoteRef, read: ReadSheet): void {
    const sheet = read.sheet;
    const updatable = this.isUpdatable(file, read.campaignFolder);
    this.valueButtons.clear();
    const trees: ViewElement[] = [this.headOf(file, updatable)];
    const subtitle = sheet.values.find((value) => value.name === "subtitle");
    if (subtitle !== undefined && subtitle.state !== "unknown") trees.push(new Paragraph({ cls: ["dd-sheet-subtitle"], text: shownTextOf(subtitle) }));
    const abilities: ViewElement[] = [];
    for (const value of sheet.abilities) abilities.push(new Div({ cls: ["dd-sheet-ability"] }, [new Bold({ text: value.label }), ...this.valueOf(file, value, true)]));
    trees.push(new Div({ cls: ["dd-sheet-abilities"] }, abilities));
    const rows: ViewElement[] = [];
    for (const value of sheet.values) rows.push(new ListItem({ cls: ["dd-sheet-row"] }, [new Span({ cls: ["dd-sheet-label"], text: value.label }), new Div({ cls: ["dd-sheet-value"] }, this.valueOf(file, value, false))]));
    trees.push(new List({ cls: ["dd-sheet-rows"] }, rows), new Paragraph({ cls: ["dd-sheet-hint"], text: TAP_A_VALUE }));
    trees.push(...importedPanels(file, read.lists, this.actions.tracking), this.statBlockOf(file, sheet));
    const mentionsPlace = new KeptHandle();
    trees.push(new Section({ cls: ["dd-sheet-mentions"], bindings: [new HandleRequest(mentionsPlace)] }));
    if (updatable) trees.push(new Div({ cls: ["dd-sheet-depart"] }, [departButton(file.path, this.actions, this.focusEdit)]));
    this.place.showInside(trees);
    if (this.focusEdit.isArmed()) this.editButton.focus();
    this.mentions.draw(mentionsPlace, file);
    this.focusPending();
  }

  private headOf(file: NoteRef, updatable: boolean): ViewElement {
    const edit = new Button({ cls: ["dd-create"], text: "Edit character", bindings: [new PressBinding(new RunAction(this.editCharacter.bind(this, file))), new HandleRequest(this.editButton)] });
    const actions: ViewElement[] = [edit];
    if (updatable) actions.push(updateButton(file, this.actions));
    return new Div({ cls: ["dd-head"] }, [new Heading1({ cls: ["dd-sheet-name"], text: file.basename }), new Div({ cls: ["dd-head-actions"] }, actions)]);
  }

  private editCharacter(file: NoteRef): void {
    this.actions.editCharacter(file);
  }

  private isUpdatable(file: NoteRef, campaignFolder: string | null): boolean {
    if (campaignFolder === null) return false;
    return isCharacterNotePath(file.path, charactersFolderOf(campaignFolder));
  }

  private statBlockOf(file: NoteRef, sheet: CharacterSheet): ViewElement {
    const block = new Div({ cls: [STAT_BLOCK_CLASS] }, new StatBlock().build(file.basename, shownValuesOf(sheet)));
    return new Section({ cls: ["dd-sheet-stat-block"] }, [new Heading2({ cls: ["dd-title"], text: "Stat block" }), block]);
  }

  private valueOf(file: NoteRef, value: SheetValue, isAbility: boolean): ViewElement[] {
    const shownText = shownTextOf(value);
    const kept = new KeptHandle();
    this.valueButtons.set(value.name, kept);
    const pressed = new RunAction(this.choose.bind(this, file, value));
    const button = new Button({
      cls: valueClasses(value, "dd-value"),
      text: shownText,
      dataName: value.name,
      label: `${value.label}: ${shownText}, ${STATE_WORDS[value.state]}`,
      bindings: [new PressBinding(pressed), new HandleRequest(kept)],
    });
    const line: ViewElement[] = [button];
    if (isAbility) {
      const modifier = modifierOf(shownText);
      if (modifier !== "") line.push(new Span({ cls: ["dd-modifier"], text: `(${modifier})` }));
    }
    if (value.earlier.length > 0) {
      const count = value.earlier.length;
      line.push(new Span({ cls: ["dd-earlier"], text: `↺ ${count}`, label: earlierText(count), title: earlierText(count) }));
    }
    return [new Div({ cls: ["dd-value-line"] }, line), ...this.sourceOf(value)];
  }

  private sourceOf(value: SheetValue): ViewElement[] {
    const caption = captionOf(value);
    if (caption === null) return [];
    const link = new Anchor({ cls: ["dd-source-link"], text: caption.text, bindings: [new PressBinding(new RunAction(this.openSource.bind(this, caption.source)))] });
    return [new Div({ cls: valueClasses(value, "dd-value-source") }, [link])];
  }

  private openSource(source: Source): void {
    this.actions.openRow(source);
  }

  private choose(file: NoteRef, value: SheetValue): void {
    this.actions.chooseValue(file, value, this.valueClosed.bind(this, value.name));
  }

  private valueClosed(name: string): void {
    this.pendingFocus = { name, until: Date.now() + PENDING_FOCUS_MS };
    this.focusPending();
  }

  private focusPending(): void {
    const pending = this.pendingFocus;
    if (pending === null) return;
    if (Date.now() > pending.until) {
      this.pendingFocus = null;
      return;
    }
    const button = this.valueButtons.get(pending.name);
    if (button !== undefined) button.focus();
  }
}
