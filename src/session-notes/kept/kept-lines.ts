import { sessionLabelOf } from "../../campaign/paths/session-file";
import { SecondPress } from "../../views/dialogs/second-press";
import type { Drafts } from "../drafts/drafts";
import type { KeptDraft, KeptDrafts } from "./kept-drafts";
import type { KeptKind } from "./kinds/kept-kind";
import { KEPT_KINDS } from "./kinds/kept-kinds";
import { shownKeptTime } from "./kept-time";

const COPY = "Copy into this session's box";
const DISCARD = "Discard";
const DISCARD_ARMED = "Press again to discard";

export type CopyTarget = () => string | null;

function keptMessage(draft: KeptDraft): string {
  return draft.kind.messageOf(sessionLabelOf(draft.path), shownKeptTime(draft.keptAt));
}

function ofKind(drafts: KeptDraft[], kind: KeptKind): KeptDraft[] {
  const found: KeptDraft[] = [];
  for (const draft of drafts) {
    if (draft.kind === kind) found.push(draft);
  }
  return found;
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
    private readonly keptDrafts: KeptDrafts,
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
    if (this.keptDrafts.isKept(key)) this.draw();
    else this.refresh();
  }

  private draw(): void {
    this.stopPresses();
    this.root.empty();
    this.rows = [];
    const kept = this.keptDrafts.kept();
    this.root.toggle(kept.length > 0);
    for (const kind of KEPT_KINDS) this.drawKind(kind, ofKind(kept, kind));
    this.refresh();
  }

  private drawKind(kind: KeptKind, drafts: KeptDraft[]): void {
    if (drafts.length === 0) return;
    this.root.createEl("h3", { cls: "dd-kept-heading", text: kind.heading });
    for (const draft of drafts) this.rows.push(this.drawDraft(draft));
  }

  private drawDraft(draft: KeptDraft): KeptRow {
    const item = this.root.createDiv({ cls: "dd-kept" });
    item.createEl("p", { cls: "dd-kept-message", text: keptMessage(draft) });
    item.createEl("pre", { cls: "dd-kept-text", text: draft.text });
    const row = item.createDiv({ cls: "dd-save-row" });
    const copy = row.createEl("button", { cls: "dd-create dd-kept-copy", text: COPY });
    const discardButton = row.createEl("button", { cls: "dd-create dd-kept-discard", text: DISCARD });
    const discard = new SecondPress((armed) => this.showArmed(discardButton, armed), () => this.keptDrafts.discard(draft.key));
    copy.addEventListener("click", () => this.copy(draft.key));
    discardButton.addEventListener("click", () => discard.press());
    return { key: draft.key, copy, discard };
  }

  private copy(key: string): void {
    const path = this.target();
    if (path === null) return;
    this.keptDrafts.copyInto(key, path);
  }

  private cannotCopy(key: string, path: string | null): boolean {
    if (path === null) return true;
    return !this.keptDrafts.canCopy(key, path);
  }

  private showArmed(button: HTMLButtonElement, armed: boolean): void {
    if (armed) button.setText(DISCARD_ARMED);
    else button.setText(DISCARD);
  }

  private stopPresses(): void {
    for (const row of this.rows) row.discard.stop();
  }
}
