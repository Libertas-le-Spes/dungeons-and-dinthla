import type { Campaign } from "../campaign/campaign";
import type { LookupMatch } from "../lookups/lookup";
import { openMatch, type LookupOpeners } from "../lookups/open-match";
import { messageOf } from "../views/message-of";
import type { AppendWriter } from "./append-writer";
import { BoxLookup } from "./box-lookup";
import { startOfLine, withoutLine } from "./box-text";
import { DraftBox } from "./draft-box";
import { hasLinesToSave } from "./draft-lines";
import type { Drafts } from "./drafts";
import { EditAllReminder } from "./edit-all-reminder";
import { LookupList } from "./lookup-list";

export interface WritingNeeds {
  drafts: Drafts;
  writer: AppendWriter;
  openers: LookupOpeners;
  campaign(): Campaign;
}

function notSavedMessage(error: unknown): string {
  return `Couldn't save: ${messageOf(error)}. Your lines are still in the box.`;
}

export class WritingPanel {
  private readonly panel: HTMLElement;
  private readonly box: DraftBox;
  private readonly lookup: BoxLookup;
  private readonly reminder: EditAllReminder;
  private readonly stopListening: () => void;

  constructor(
    parent: HTMLElement,
    private readonly sessionPath: string,
    private readonly needs: WritingNeeds,
  ) {
    this.panel = parent.createEl("section", { cls: "dd-notes-panel dd-writing-panel" });
    this.reminder = new EditAllReminder(this.panel);
    this.box = new DraftBox(this.panel, needs.drafts.textOf(sessionPath), () => void this.save());
    const list = new LookupList(this.box.lookups, (match) => this.pick(match));
    this.lookup = new BoxLookup(this.box.textarea, list, needs.campaign);
    this.box.textarea.addEventListener("keydown", (event) => this.lookup.keyDown(event));
    this.box.textarea.addEventListener("input", () => this.typed());
    this.box.textarea.addEventListener("click", () => this.refreshLookup());
    this.box.textarea.addEventListener("keyup", () => this.refreshLookup());
    this.box.textarea.addEventListener("blur", () => this.lookup.close());
    this.stopListening = needs.drafts.subscribe((path) => this.draftChanged(path));
    this.box.setSaving(needs.drafts.isSaving(sessionPath));
  }

  get textarea(): HTMLTextAreaElement {
    return this.box.textarea;
  }

  focus(): void {
    this.box.focus();
  }

  close(): void {
    this.stopListening();
  }

  setShown(shown: boolean): void {
    this.panel.toggle(shown);
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

  private typed(): void {
    this.needs.drafts.keep(this.sessionPath, this.box.text);
    this.box.refresh();
    this.refreshLookup();
  }

  private pick(match: LookupMatch): void {
    const line = this.lookup.currentLine();
    const text = withoutLine(this.box.text, line.index);
    this.box.text = text;
    this.needs.drafts.keep(this.sessionPath, text);
    const caret = startOfLine(text, line.index);
    this.box.textarea.setSelectionRange(caret, caret);
    this.lookup.close();
    openMatch(this.needs.openers, match, match.source, () => this.box.focus());
  }
}
