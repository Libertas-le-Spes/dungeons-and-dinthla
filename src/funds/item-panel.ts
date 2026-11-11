import { Component, getFrontMatterInfo } from "obsidian";
import type { Campaign, ItemRecord, Source } from "../campaign/campaign";
import { noteNameOf } from "../campaign/note-name";
import type { NoteTexts } from "../campaign/note-texts";
import { addLinkedText, type LinkActions } from "../views/lists/linked-text";
import { messageOf } from "../views/dialogs/message-of";
import { holderNameOf, THE_PARTY_LABEL } from "./item-groups";
import { itemOfNote } from "./item-of-note";
import { statusOf } from "./item-plan";
import { STATUS_WORDS } from "./status-words";

export type OpenItem = (name: string, source: Source, onClosed: (changed: boolean) => void) => void;

export interface ItemStore {
  readonly current: Campaign;
  subscribe(listener: () => void): () => void;
}

export interface ItemPanelNeeds {
  store: ItemStore;
  texts: NoteTexts;
  actions: LinkActions;
  openItem: OpenItem;
  editNote(path: string): void;
  close(): void;
}

export const CHANGE_ITEM = "Change holder or status";
export const EDIT_NOTE = "Edit its note";
export const CLOSE_ITEM = "All items";
export const EMPTY_STORY = "Its note has no story yet.";
export const NOTE_MISSING = "Its note isn't there any more.";

export function noLineText(name: string): string {
  return `No session line names ${name} yet, so no one holds it. A line like “$$ [[${name}]] :changed to the party” in a session gives it to the party.`;
}

function holderOf(item: ItemRecord): string {
  const name = holderNameOf(item.holder);
  if (name === "") return THE_PARTY_LABEL;
  return name;
}

function holderLabelOf(item: ItemRecord): string {
  if (item.gone === null) return "Held by";
  return "Last held by";
}

function storyOf(text: string): string[] {
  const body = text.substring(getFrontMatterInfo(text).contentStart);
  return body.split("\n").filter((line) => line.trim() !== "");
}

export class ItemPanel extends Component {
  private facts!: HTMLElement;
  private story!: HTMLElement;
  private changeButton: HTMLButtonElement | null = null;

  constructor(
    private readonly panelEl: HTMLElement,
    private readonly path: string,
    private readonly needs: ItemPanelNeeds,
  ) {
    super();
  }

  override onload(): void {
    const panel = this.panelEl;
    panel.empty();
    const head = panel.createDiv({ cls: "dd-head" });
    head.createEl("h2", { cls: "dd-title dd-item-name", text: noteNameOf(this.path) });
    const close = head.createEl("button", { cls: "dd-create dd-item-close", text: CLOSE_ITEM });
    this.registerDomEvent(close, "click", () => this.needs.close());
    this.facts = panel.createDiv({ cls: "dd-item-facts" });
    this.story = panel.createDiv({ cls: "dd-item-story" });
    const edit = panel.createEl("button", { cls: "dd-create dd-item-edit", text: EDIT_NOTE });
    this.registerDomEvent(edit, "click", () => this.needs.editNote(this.path));
    this.register(this.needs.store.subscribe(() => this.showFacts()));
    this.register(this.needs.texts.onChanged((path, text) => this.noteChanged(path, text)));
    this.showFacts();
    void this.readStory();
  }

  private showFacts(): void {
    this.facts.empty();
    this.changeButton = null;
    const item = itemOfNote(this.needs.store.current.items, this.path);
    if (item === null) {
      this.facts.createEl("p", { cls: "dd-empty", text: noLineText(noteNameOf(this.path)) });
      return;
    }
    const list = this.facts.createEl("dl", { cls: "dd-item-fact-list" });
    this.addFact(list, holderLabelOf(item), holderOf(item));
    this.addFact(list, "Status", STATUS_WORDS[statusOf(item)]);
    const change = this.facts.createEl("button", { cls: "mod-cta dd-item-change", text: CHANGE_ITEM });
    change.addEventListener("click", () => this.needs.openItem(item.name, item.source, () => this.focusChange()));
    this.changeButton = change;
  }

  private addFact(list: HTMLElement, label: string, value: string): void {
    list.createEl("dt", { text: label });
    list.createEl("dd", { text: value });
  }

  private focusChange(): void {
    if (this.changeButton !== null) this.changeButton.focus();
  }

  private async readStory(): Promise<void> {
    try {
      this.showStory(await this.needs.texts.read(this.path));
    } catch (error) {
      this.story.empty();
      this.story.createEl("p", { cls: "dd-empty", text: `Couldn't read its note: ${messageOf(error)}` });
    }
  }

  private noteChanged(path: string, text: string): void {
    if (path === this.path) this.showStory(text);
  }

  private showStory(text: string | null): void {
    this.story.empty();
    if (text === null) {
      this.story.createEl("p", { cls: "dd-empty", text: NOTE_MISSING });
      return;
    }
    const lines = storyOf(text);
    if (lines.length === 0) this.story.createEl("p", { cls: "dd-empty", text: EMPTY_STORY });
    for (const line of lines) addLinkedText(this.story.createEl("p"), line, [], this.path, this.needs.actions);
  }
}
