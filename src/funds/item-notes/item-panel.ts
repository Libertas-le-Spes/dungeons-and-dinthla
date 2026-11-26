import type { Campaign, ItemRecord, Source } from "../../campaign/record/campaign";
import { noteNameOf } from "../../campaign/paths/note-name";
import type { NoteTexts } from "../../campaign/reading/note-texts";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { LinkedText } from "../../views/components/rows/linked-text";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Description, DescriptionList, Div, Heading2, Paragraph, Section, Term } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { messageOf } from "../../views/dialogs/message-of";
import type { PagePart } from "../../views/pages/page-part";
import { holderNameOf, THE_PARTY_LABEL } from "../items/item-groups";
import { itemOfNote } from "./item-of-note";
import { statusOf } from "../items/item-plan";
import { STATUS_WORDS } from "../items/status-words";

export type OpenItem = (name: string, source: Source, onClosed: (changed: boolean) => void) => void;

export interface ItemStore {
  readonly current: Campaign;
  subscribe(listener: () => void): () => void;
}

export interface ItemPanelNeeds {
  store: ItemStore;
  texts: NoteTexts;
  opener: LinkOpener;
  openItem: OpenItem;
  syntax: PropertiesSyntax;
  editNote(path: string): void;
  close(): void;
}

export const CHANGE_ITEM = "Change holder or status";
export const EDIT_NOTE = "Edit its note";
export const CLOSE_ITEM = "All items";
export const EMPTY_STORY = "No story yet.";
export const NOTE_MISSING = "Note not found.";

export function noLineText(name: string): string {
  return `No line names ${name} yet.`;
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

function factOf(label: string, value: string): ViewElement[] {
  return [new Term({ text: label }), new Description({ text: value })];
}

function emptyLine(text: string): ViewElement {
  return new Paragraph({ cls: ["dd-empty"], text });
}

export class ItemPanel implements PagePart {
  private readonly facts = new KeptHandle();
  private readonly story = new KeptHandle();
  private readonly changeButton = new KeptHandle();
  private readonly stops: (() => void)[] = [];
  private reading: Promise<void> = Promise.resolve();

  constructor(
    private readonly path: string,
    private readonly needs: ItemPanelNeeds,
  ) {}

  tree(): ViewElement {
    const head = new Div({ cls: ["dd-head"] }, [
      new Heading2({ cls: ["dd-title", "dd-item-name"], text: noteNameOf(this.path) }),
      new Button({ cls: ["dd-create", "dd-item-close"], text: CLOSE_ITEM, bindings: [new PressBinding(new RunAction(this.close.bind(this)))] }),
    ]);
    return new Section({ cls: ["dd-panel", "dd-shown-item"] }, [
      head,
      new Div({ cls: ["dd-item-facts"], bindings: [new HandleRequest(this.facts)] }),
      new Div({ cls: ["dd-item-story"], bindings: [new HandleRequest(this.story)] }),
      new Button({ cls: ["dd-create", "dd-item-edit"], text: EDIT_NOTE, bindings: [new PressBinding(new RunAction(this.editNote.bind(this)))] }),
    ]);
  }

  started(): void {
    this.stops.push(this.needs.store.subscribe(this.showFacts.bind(this)));
    this.stops.push(this.needs.texts.onChanged(this.noteChanged.bind(this)));
    this.showFacts();
    this.reading = this.readStory();
  }

  stopped(): void {
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  storyRead(): Promise<void> {
    return this.reading;
  }

  private close(): void {
    this.needs.close();
  }

  private editNote(): void {
    this.needs.editNote(this.path);
  }

  private showFacts(): void {
    const item = itemOfNote(this.needs.store.current.items, this.path);
    if (item === null) {
      this.facts.showInside([emptyLine(noLineText(noteNameOf(this.path)))]);
      return;
    }
    const list = new DescriptionList({ cls: ["dd-item-fact-list"] }, [...factOf(holderLabelOf(item), holderOf(item)), ...factOf("Status", STATUS_WORDS[statusOf(item)])]);
    const pressed = new RunAction(this.openItem.bind(this, item));
    const change = new Button({ cls: ["mod-cta", "dd-item-change"], text: CHANGE_ITEM, bindings: [new PressBinding(pressed), new HandleRequest(this.changeButton)] });
    this.facts.showInside([list, change]);
  }

  private openItem(item: ItemRecord): void {
    this.needs.openItem(item.name, item.source, this.focusChange.bind(this));
  }

  private focusChange(): void {
    this.changeButton.focus();
  }

  private async readStory(): Promise<void> {
    try {
      this.showStory(await this.needs.texts.read(this.path));
    } catch (error) {
      this.story.showInside([emptyLine(`Couldn't read its note: ${messageOf(error)}`)]);
    }
  }

  private noteChanged(path: string, text: string): void {
    if (path === this.path) this.showStory(text);
  }

  private showStory(text: string | null): void {
    if (text === null) {
      this.story.showInside([emptyLine(NOTE_MISSING)]);
      return;
    }
    const body = text.substring(this.needs.syntax.propertiesIn(text).contentStart);
    const lines = body.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      this.story.showInside([emptyLine(EMPTY_STORY)]);
      return;
    }
    const linked = new LinkedText([], this.path, this.needs.opener);
    const shown: ViewElement[] = [];
    for (const line of lines) shown.push(new Paragraph({}, linked.build(line)));
    this.story.showInside(shown);
  }
}
