import { debounce, type Debouncer, type TFile } from "obsidian";
import { sessionLabelOf } from "../campaign/session-file";
import { addLinkedText, addRowButton, type LinkActions } from "../views/linked-text";
import { messageOf } from "../views/message-of";
import type { MentionNotes } from "./mention-notes";
import { readMentions, type Mention } from "./mentions";

export const IN_THE_NOTES = "In the notes";

const SETTLE_MS = 200;

export function noMentions(file: TFile): string {
  return `No note mentions [[${file.basename}]] yet.`;
}

export function couldNotReadMentions(file: TFile, error: unknown): string {
  return `Couldn't read the notes that mention ${file.basename}: ${messageOf(error)}`;
}

function countText(count: number): string {
  if (count === 1) return "1 line";
  return `${count} lines`;
}

interface Shown {
  parent: HTMLElement;
  file: TFile;
}

export class MentionsPanel {
  private renders = 0;
  private shown: Shown | null = null;
  private sources: string[] = [];
  private readonly redrawSoon: Debouncer<[], void>;

  constructor(
    private readonly notes: MentionNotes,
    private readonly actions: LinkActions,
  ) {
    this.redrawSoon = debounce(() => this.redraw(), SETTLE_MS, true);
  }

  watch(): () => void {
    const stopResolved = this.notes.onLinksResolved((path) => {
      if (this.lists(path) || this.linksHere(path)) this.redrawSoon();
    });
    const stopMoved = this.notes.onNoteMoved((path) => {
      if (this.lists(path)) this.redrawSoon();
    });
    return () => {
      stopResolved();
      stopMoved();
    };
  }

  clear(): void {
    this.renders += 1;
    this.shown = null;
  }

  async draw(parent: HTMLElement, file: TFile): Promise<void> {
    const render = ++this.renders;
    this.shown = { parent, file };
    try {
      const mentions = await readMentions(file, this.notes);
      if (render !== this.renders) return;
      this.sources = mentions.map((mention) => mention.source.path);
      this.drawMentions(parent, file, mentions);
    } catch (error) {
      if (render !== this.renders) return;
      parent.empty();
      this.addTitle(parent);
      parent.createEl("p", { cls: "dd-empty", text: couldNotReadMentions(file, error) });
    }
  }

  private redraw(): void {
    const shown = this.shown;
    if (shown !== null) void this.draw(shown.parent, shown.file);
  }

  private lists(path: string): boolean {
    return this.sources.includes(path);
  }

  private linksHere(path: string): boolean {
    const shown = this.shown;
    if (shown === null) return false;
    return this.notes.linkedLines(path, shown.file.path).length > 0;
  }

  private addTitle(parent: HTMLElement): HTMLElement {
    return parent.createDiv({ cls: "dd-head" }).createEl("h2", { cls: "dd-title", text: IN_THE_NOTES });
  }

  private drawMentions(parent: HTMLElement, file: TFile, mentions: Mention[]): void {
    parent.empty();
    const title = this.addTitle(parent);
    if (mentions.length === 0) {
      parent.createEl("p", { cls: "dd-empty", text: noMentions(file) });
      return;
    }
    title.createSpan({ cls: "dd-count", text: countText(mentions.length) });
    const list = parent.createEl("ul", { cls: "dd-list" });
    for (const mention of mentions) {
      const row = addRowButton(list, mention.source, this.actions);
      const body = row.createSpan({ cls: "dd-body" });
      addLinkedText(body.createSpan({ cls: "dd-text" }), mention.text, [], mention.source.path, this.actions);
      body.createSpan({ cls: "dd-meta", text: sessionLabelOf(mention.source.path) });
    }
  }
}
