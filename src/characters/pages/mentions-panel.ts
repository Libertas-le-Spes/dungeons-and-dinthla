import { debounce, type Debouncer, type TFile } from "obsidian";
import { addLinkedText, addRowButton, type LinkActions } from "../../views/lists/linked-text";
import { messageOf } from "../../views/dialogs/message-of";
import type { MentionNotes } from "../reading/mention-notes";
import { readMentions, type Mention } from "../reading/mentions";

export const IN_THE_NOTES = "In the notes";

const SETTLE_MS = 200;

export function noMentions(file: TFile): string {
  return `No session mentions [[${file.basename}]] yet.`;
}

export function couldNotReadMentions(file: TFile, error: unknown): string {
  return `Couldn't read the sessions that mention ${file.basename}: ${messageOf(error)}`;
}

function countText(count: number): string {
  if (count === 1) return "1 line";
  return `${count} lines`;
}

interface Shown {
  file: TFile;
  parent: HTMLElement;
  mentions: Mention[] | null;
  reading: boolean;
}

function listedPaths(shown: Shown): string[] {
  if (shown.mentions === null) return [];
  return shown.mentions.map((mention) => mention.source.path);
}

export class MentionsPanel {
  private renders = 0;
  private shown: Shown | null = null;
  private readonly readSoon: Debouncer<[Shown], void>;

  constructor(
    private readonly notes: MentionNotes,
    private readonly actions: LinkActions,
  ) {
    this.readSoon = debounce((shown: Shown) => void this.read(shown), SETTLE_MS, true);
  }

  watch(): () => void {
    const stopResolved = this.notes.onLinksResolved((path) => this.readIfShown(path, true));
    const stopMoved = this.notes.onNoteMoved((path) => this.readIfShown(path, false));
    return () => {
      stopResolved();
      stopMoved();
      this.readSoon.cancel();
    };
  }

  clear(): void {
    this.renders += 1;
    this.shown = null;
    this.readSoon.cancel();
  }

  draw(parent: HTMLElement, file: TFile): void {
    const shown = this.shown;
    if (shown === null || shown.file.path !== file.path) {
      const next = { file, parent, mentions: null, reading: false };
      this.shown = next;
      void this.read(next);
      return;
    }
    shown.file = file;
    shown.parent = parent;
    if (shown.mentions !== null) this.drawMentions(shown, shown.mentions);
    else if (!shown.reading) void this.read(shown);
  }

  private readIfShown(path: string, orNowLinking: boolean): void {
    const shown = this.shown;
    if (shown === null) return;
    const listed = listedPaths(shown).includes(path);
    if (listed || (orNowLinking && this.notes.linkedLines(path, shown.file.path).length > 0)) this.readSoon(shown);
  }

  private async read(shown: Shown): Promise<void> {
    const render = ++this.renders;
    shown.reading = true;
    try {
      const mentions = await readMentions(shown.file, this.notes);
      if (render !== this.renders) return;
      shown.reading = false;
      shown.mentions = mentions;
      this.drawMentions(shown, mentions);
    } catch (error) {
      if (render !== this.renders) return;
      shown.reading = false;
      shown.mentions = null;
      shown.parent.empty();
      this.addTitle(shown.parent);
      shown.parent.createEl("p", { cls: "dd-empty", text: couldNotReadMentions(shown.file, error) });
    }
  }

  private addTitle(parent: HTMLElement): HTMLElement {
    return parent.createDiv({ cls: "dd-head" }).createEl("h2", { cls: "dd-title", text: IN_THE_NOTES });
  }

  private drawMentions(shown: Shown, mentions: Mention[]): void {
    const parent = shown.parent;
    parent.empty();
    const title = this.addTitle(parent);
    if (mentions.length === 0) {
      parent.createEl("p", { cls: "dd-empty", text: noMentions(shown.file) });
      return;
    }
    title.createSpan({ cls: "dd-count", text: countText(mentions.length) });
    const list = parent.createEl("ul", { cls: "dd-list" });
    for (const mention of mentions) {
      const row = addRowButton(list, mention.source, this.actions);
      const body = row.createSpan({ cls: "dd-body" });
      addLinkedText(body.createSpan({ cls: "dd-text" }), mention.text, [], mention.source.path, this.actions);
      body.createSpan({ cls: "dd-meta", text: mention.where });
    }
  }
}
