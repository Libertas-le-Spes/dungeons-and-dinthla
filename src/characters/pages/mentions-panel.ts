import type { NoteRef } from "../../host/notes/note-ref";
import type { Pause, Pauses } from "../../host/keeping/pauses";
import type { Source } from "../../campaign/record/campaign";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { LinkedText } from "../../views/components/rows/linked-text";
import { SourceRow } from "../../views/components/rows/source-row";
import type { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Div, Heading2, List, ListItem, Paragraph, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { messageOf } from "../../views/dialogs/message-of";
import type { MentionNotes } from "../reading/mention-notes";
import { readMentions, type Mention } from "../reading/mentions";
import { PendingWork } from "../../views/pending/pending-work";

export const IN_THE_NOTES = "In the notes";

const SETTLE_MS = 200;

export interface MentionActions extends LinkOpener {
  openRow(source: Source): void;
}

export function noMentions(file: NoteRef): string {
  return `No session mentions [[${file.basename}]] yet.`;
}

export function couldNotReadMentions(file: NoteRef, error: unknown): string {
  return `Couldn't read the sessions that mention ${file.basename}: ${messageOf(error)}`;
}

function countText(count: number): string {
  if (count === 1) return "1 line";
  return `${count} lines`;
}

interface Shown {
  file: NoteRef;
  place: KeptHandle;
  mentions: Mention[] | null;
  reading: boolean;
}

function listedPaths(shown: Shown): string[] {
  if (shown.mentions === null) return [];
  return shown.mentions.map((mention) => mention.source.path);
}

function headOf(count: readonly ViewElement[]): ViewElement {
  return new Div({ cls: ["dd-head"] }, [new Heading2({ cls: ["dd-title"], text: IN_THE_NOTES }, count)]);
}

export class MentionsPanel {
  private renders = 0;
  private shown: Shown | null = null;
  private readonly reading = new PendingWork();
  private readonly readSoon: Pause<[Shown]>;

  constructor(
    private readonly notes: MentionNotes,
    private readonly actions: MentionActions,
    pauses: Pauses,
  ) {
    this.readSoon = pauses.pauseOf(this.startReading.bind(this), SETTLE_MS);
  }

  watch(): () => void {
    const stopResolved = this.notes.onLinksResolved(this.readIfShown.bind(this, true));
    const stopMoved = this.notes.onNoteMoved(this.readIfShown.bind(this, false));
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

  draw(place: KeptHandle, file: NoteRef): void {
    const shown = this.shown;
    if (shown === null || shown.file.path !== file.path) {
      const next = { file, place, mentions: null, reading: false };
      this.shown = next;
      this.startReading(next);
      return;
    }
    shown.file = file;
    shown.place = place;
    if (shown.mentions !== null) this.drawMentions(shown, shown.mentions);
    else if (!shown.reading) this.startReading(shown);
  }

  readSettled(): Promise<void> {
    return this.reading.settled();
  }

  private startReading(shown: Shown): void {
    this.reading.add(this.read(shown));
  }

  private readIfShown(orNowLinking: boolean, path: string): void {
    const shown = this.shown;
    if (shown === null) return;
    const listed = listedPaths(shown).includes(path);
    if (listed || (orNowLinking && this.notes.linkedLines(path, shown.file.path).length > 0)) this.readSoon.call(shown);
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
      shown.place.showInside([headOf([]), new Paragraph({ cls: ["dd-empty"], text: couldNotReadMentions(shown.file, error) })]);
    }
  }

  private drawMentions(shown: Shown, mentions: Mention[]): void {
    if (mentions.length === 0) {
      shown.place.showInside([headOf([]), new Paragraph({ cls: ["dd-empty"], text: noMentions(shown.file) })]);
      return;
    }
    const rows: ViewElement[] = [];
    for (const mention of mentions) rows.push(this.rowOf(mention));
    shown.place.showInside([headOf([new Span({ cls: ["dd-count"], text: countText(mentions.length) })]), new List({ cls: ["dd-list"] }, rows)]);
  }

  private rowOf(mention: Mention): ViewElement {
    const linked = new LinkedText([], mention.source.path, this.actions).build(mention.text);
    const body = new Span({ cls: ["dd-body"] }, [new Span({ cls: ["dd-text"] }, linked), new Span({ cls: ["dd-meta"], text: mention.where })]);
    const open = new RunAction(this.openRow.bind(this, mention.source));
    return new ListItem({}, [new SourceRow(mention.source, open).build([body])]);
  }

  private openRow(source: Source): void {
    this.actions.openRow(source);
  }
}
