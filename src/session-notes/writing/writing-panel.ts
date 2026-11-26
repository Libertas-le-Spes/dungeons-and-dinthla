import type { Campaign } from "../../campaign/record/campaign";
import type { LookupMatch } from "../../lookups/lookup";
import type { LookupOpeners } from "../../kinds/lookup-openers";
import { openMatch } from "../../lookups/open-match";
import { messageOf } from "../../views/dialogs/message-of";
import type { AppendWriter } from "../drafts/append-writer";
import { BoxLookup } from "./box-lookup";
import { startOfLine, withoutLine } from "./box-text";
import { DraftBox } from "./draft-box";
import { hasLinesToSave } from "../drafts/draft-lines";
import type { Drafts } from "../drafts/drafts";
import { EditAllReminder } from "./edit-all-reminder";
import { LookupList } from "./lookup-list";
import { PendingWork } from "../../views/pending/pending-work";
import type { CaretWatcher, PressedKey } from "../../views/elements/bindings/binding-wiring";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { Section } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

export interface WritingNeeds {
  drafts: Drafts;
  writer: AppendWriter;
  openers: LookupOpeners;
  campaign(): Campaign;
}

function notSavedMessage(error: unknown): string {
  return `Couldn't save: ${messageOf(error)}. Your lines are still in the box.`;
}

export class WritingPanel implements CaretWatcher {
  private readonly panel = new KeptHandle();
  private readonly box: DraftBox;
  private readonly list: LookupList;
  private readonly lookup: BoxLookup;
  private readonly reminder = new EditAllReminder();
  private readonly saving = new PendingWork();
  private stopListening: (() => void) | null = null;

  constructor(
    private readonly sessionPath: string,
    private readonly needs: WritingNeeds,
  ) {
    this.box = new DraftBox(needs.drafts.textOf(sessionPath), this.startSaving.bind(this));
    this.list = new LookupList(this.pick.bind(this));
    this.lookup = new BoxLookup(this.box, this.list, needs.campaign);
  }

  tree(): ViewElement {
    return new Section({ cls: ["dd-notes-panel", "dd-writing-panel"], bindings: [new HandleRequest(this.panel)] }, [this.reminder.tree(), ...this.box.trees(this, this.list.tree())]);
  }

  start(): void {
    this.stopListening = this.needs.drafts.subscribe(this.draftChanged.bind(this));
    this.box.setSaving(this.needs.drafts.isSaving(this.sessionPath));
  }

  keyDown(pressed: PressedKey): void {
    this.lookup.keyDown(pressed);
  }

  typed(text: string, caret: number): void {
    this.box.took(text, caret);
    this.needs.drafts.keep(this.sessionPath, this.box.text);
    this.box.refresh();
    this.refreshLookup();
  }

  caretMoved(caret: number): void {
    this.box.caretAt(caret);
    this.refreshLookup();
  }

  left(): void {
    this.lookup.close();
  }

  focus(): void {
    this.box.focus();
  }

  saveSettled(): Promise<void> {
    return this.saving.settled();
  }

  close(): void {
    if (this.stopListening !== null) this.stopListening();
    this.stopListening = null;
  }

  setShown(shown: boolean): void {
    this.panel.setHidden(!shown);
    if (!shown) this.lookup.close();
  }

  setEditAllWaiting(waiting: boolean): void {
    this.reminder.setShown(waiting);
  }

  setRemoving(removing: boolean): void {
    this.box.setRemoving(removing);
  }

  setGone(gone: boolean): void {
    this.box.setGone(gone);
    if (gone) this.lookup.close();
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    const drafts = this.needs.drafts;
    drafts.keep(this.sessionPath, this.box.text);
    try {
      await drafts.save(this.sessionPath, (path, draft) => this.needs.writer.save(path, draft));
      this.box.say("");
    } catch (error) {
      this.box.say(notSavedMessage(error));
    }
    this.box.focus();
  }

  private startSaving(): void {
    this.saving.add(this.save());
  }

  private canSave(): boolean {
    if (this.box.isGone || this.box.isRemoving) return false;
    if (this.needs.drafts.isSaving(this.sessionPath)) return false;
    return hasLinesToSave(this.box.text);
  }

  private draftChanged(path: string): void {
    if (path !== this.sessionPath) return;
    const saving = this.needs.drafts.isSaving(path);
    this.box.setSaving(saving);
    if (saving) {
      this.lookup.close();
      return;
    }
    this.takeText(this.needs.drafts.textOf(path));
  }

  private takeText(text: string): void {
    if (this.box.text === text) return;
    this.box.text = text;
  }

  private refreshLookup(): void {
    if (this.box.isGone || this.needs.drafts.isSaving(this.sessionPath)) return;
    this.lookup.refresh();
  }

  private pick(match: LookupMatch): void {
    const line = this.lookup.currentLine();
    const text = withoutLine(this.box.text, line.index);
    this.box.text = text;
    this.needs.drafts.keep(this.sessionPath, text);
    const caret = startOfLine(text, line.index);
    this.box.placeCaret(caret);
    this.lookup.close();
    openMatch(this.needs.openers, match, match.source, () => this.box.focus());
  }
}
