import { sessionLabelOf } from "../../campaign/paths/session-file";
import { SecondPress } from "../../views/dialogs/second-press";
import type { Drafts } from "../drafts/drafts";
import type { KeptDraft, KeptDrafts } from "./kept-drafts";
import type { KeptKind } from "./kinds/kept-kind";
import { KEPT_KINDS } from "./kinds/kept-kinds";
import { shownKeptTime } from "./kept-time";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Heading3, Paragraph, Pre, Section } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

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
  copy: KeptHandle;
  discard: SecondPress;
}

class DiscardLabel {
  constructor(private readonly button: KeptHandle) {}

  showArmed(armed: boolean): void {
    if (armed) this.button.setText(DISCARD_ARMED);
    else this.button.setText(DISCARD);
  }
}

export class KeptLines {
  private readonly root = new KeptHandle();
  private stopListening: (() => void) | null = null;
  private rows: KeptRow[] = [];

  constructor(
    private readonly drafts: Drafts,
    private readonly keptDrafts: KeptDrafts,
    private readonly target: CopyTarget,
  ) {}

  tree(): ViewElement {
    return new Section({ cls: ["dd-notes-panel", "dd-kept-lines"], bindings: [new HandleRequest(this.root)] });
  }

  start(): void {
    this.stopListening = this.drafts.subscribe(this.draftChanged.bind(this));
    this.draw();
  }

  close(): void {
    if (this.stopListening !== null) this.stopListening();
    this.stopListening = null;
    this.stopPresses();
  }

  refresh(): void {
    const path = this.target();
    for (const row of this.rows) row.copy.setDisabled(this.cannotCopy(row.key, path));
  }

  private draftChanged(key: string): void {
    if (this.keptDrafts.isKept(key)) this.draw();
    else this.refresh();
  }

  private draw(): void {
    this.stopPresses();
    this.rows = [];
    const kept = this.keptDrafts.kept();
    const shown: ViewElement[] = [];
    for (const kind of KEPT_KINDS) shown.push(...this.kindOf(kind, ofKind(kept, kind)));
    this.root.showInside(shown);
    this.root.setHidden(kept.length === 0);
    this.refresh();
  }

  private kindOf(kind: KeptKind, drafts: KeptDraft[]): ViewElement[] {
    if (drafts.length === 0) return [];
    const shown: ViewElement[] = [new Heading3({ cls: ["dd-kept-heading"], text: kind.heading })];
    for (const draft of drafts) shown.push(this.draftOf(draft));
    return shown;
  }

  private draftOf(draft: KeptDraft): ViewElement {
    const copy = new KeptHandle();
    const discardButton = new KeptHandle();
    const label = new DiscardLabel(discardButton);
    const discard = new SecondPress(label.showArmed.bind(label), this.discard.bind(this, draft.key));
    this.rows.push({ key: draft.key, copy, discard });
    const row = new Div({ cls: ["dd-save-row"] }, [
      new Button({ cls: ["dd-create", "dd-kept-copy"], text: COPY, bindings: [new PressBinding(new RunAction(this.copy.bind(this, draft.key))), new HandleRequest(copy)] }),
      new Button({ cls: ["dd-create", "dd-kept-discard"], text: DISCARD, bindings: [new PressBinding(new RunAction(discard.press.bind(discard))), new HandleRequest(discardButton)] }),
    ]);
    return new Div({ cls: ["dd-kept"] }, [new Paragraph({ cls: ["dd-kept-message"], text: keptMessage(draft) }), new Pre({ cls: ["dd-kept-text"], text: draft.text }), row]);
  }

  private discard(key: string): void {
    this.keptDrafts.discard(key);
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

  private stopPresses(): void {
    for (const row of this.rows) row.discard.stop();
  }
}
