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
  private readonly box: DraftBox;
  private readonly lookup: BoxLookup;

  constructor(
    parent: HTMLElement,
    private readonly sessionPath: string,
    private readonly needs: WritingNeeds,
  ) {
    const panel = parent.createEl("section", { cls: "dd-notes-panel dd-writing-panel" });
    this.box = new DraftBox(panel, needs.drafts.textOf(sessionPath), () => void this.save());
    const list = new LookupList(this.box.lookups, (match) => this.pick(match));
    this.lookup = new BoxLookup(this.box.textarea, list, needs.campaign);
    this.box.textarea.addEventListener("keydown", (event) => this.lookup.keyDown(event));
    this.box.textarea.addEventListener("input", () => this.typed());
    this.box.textarea.addEventListener("click", () => this.lookup.refresh());
    this.box.textarea.addEventListener("keyup", () => this.lookup.refresh());
    this.box.textarea.addEventListener("blur", () => this.lookup.close());
  }

  get textarea(): HTMLTextAreaElement {
    return this.box.textarea;
  }

  focus(): void {
    this.box.focus();
  }

  async save(): Promise<void> {
    const draft = this.box.text;
    if (this.box.isSaving || !hasLinesToSave(draft)) return;
    this.box.setSaving(true);
    this.lookup.close();
    try {
      const left = await this.needs.writer.save(this.sessionPath, draft);
      this.needs.drafts.keep(this.sessionPath, left);
      this.box.text = left;
      this.box.say("");
    } catch (error) {
      this.box.say(notSavedMessage(error));
    } finally {
      this.box.setSaving(false);
      this.box.focus();
    }
  }

  private typed(): void {
    this.needs.drafts.keep(this.sessionPath, this.box.text);
    this.box.refresh();
    this.lookup.refresh();
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
