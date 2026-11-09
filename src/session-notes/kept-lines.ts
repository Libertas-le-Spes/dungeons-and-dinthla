import { sessionLabelOf } from "../campaign/session-file";
import { SecondPress } from "../views/second-press";
import type { DeletedDraft, DeletedDrafts } from "./deleted-drafts";
import { shownDeletedTime } from "./deleted-time";
import type { Drafts } from "./drafts";

const HEADING = "Kept from deleted sessions";
const COPY = "Copy into this session's box";
const DISCARD = "Discard";
const DISCARD_ARMED = "Press again to discard";

export type CopyTarget = () => string | null;

function keptMessage(draft: DeletedDraft): string {
  return `Lines typed but not saved in ${sessionLabelOf(draft.path)} were kept when its note was deleted on ${shownDeletedTime(draft.deletedAt)}.`;
}

interface KeptRow {
  key: string;
  copy: HTMLButtonElement;
  discard: SecondPress;
}

export class KeptLines {
  private readonly root: HTMLElement;
  private readonly stopListening: () => void;
  private rows: KeptRow[] = [];

  constructor(
    parent: HTMLElement,
    drafts: Drafts,
    private readonly deleted: DeletedDrafts,
    private readonly target: CopyTarget,
  ) {
    this.root = parent.createEl("section", { cls: "dd-notes-panel dd-kept-lines" });
    this.stopListening = drafts.subscribe((key) => this.draftChanged(key));
    this.draw();
  }

  close(): void {
    this.stopListening();
    this.stopPresses();
  }

  refresh(): void {
    const path = this.target();
    for (const row of this.rows) row.copy.disabled = this.cannotCopy(row.key, path);
  }

  private draftChanged(key: string): void {
    if (this.deleted.isKept(key)) this.draw();
    else this.refresh();
  }

  private draw(): void {
    this.stopPresses();
    this.root.empty();
    this.rows = [];
    const kept = this.deleted.kept();
    this.root.toggle(kept.length > 0);
    if (kept.length === 0) return;
    this.root.createEl("h3", { cls: "dd-kept-heading", text: HEADING });
    for (const draft of kept) this.rows.push(this.drawDraft(draft));
    this.refresh();
  }

  private drawDraft(draft: DeletedDraft): KeptRow {
    const item = this.root.createDiv({ cls: "dd-kept" });
    item.createEl("p", { cls: "dd-kept-message", text: keptMessage(draft) });
    item.createEl("pre", { cls: "dd-kept-text", text: draft.text });
    const row = item.createDiv({ cls: "dd-save-row" });
    const copy = row.createEl("button", { cls: "dd-create dd-kept-copy", text: COPY });
    const discardButton = row.createEl("button", { cls: "dd-create dd-kept-discard", text: DISCARD });
    const discard = new SecondPress((armed) => this.showArmed(discardButton, armed), () => this.deleted.discard(draft.key));
    copy.addEventListener("click", () => this.copy(draft.key));
    discardButton.addEventListener("click", () => discard.press());
    return { key: draft.key, copy, discard };
  }

  private copy(key: string): void {
    const path = this.target();
    if (path === null) return;
    this.deleted.copyInto(key, path);
  }

  private cannotCopy(key: string, path: string | null): boolean {
    if (path === null) return true;
    return !this.deleted.canCopy(key, path);
  }

  private showArmed(button: HTMLButtonElement, armed: boolean): void {
    if (armed) button.setText(DISCARD_ARMED);
    else button.setText(DISCARD);
  }

  private stopPresses(): void {
    for (const row of this.rows) row.discard.stop();
  }
}
