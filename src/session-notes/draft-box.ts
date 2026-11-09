import { hasLinesToSave } from "./draft-lines";

const LABEL = "Type a line starting with ? ! or $, and link names with [[ ]]";
const PLACEHOLDER = "! Find the caravan, from: [[Lady Vess]], reward: 200 gp";
const HELP = "To find and update an earlier note, start a line with ?? for a question, !! for a quest or $$ for an item, then a few words.";
const SAVE_HINT = "Ctrl + Enter saves";

function isSaveKey(event: KeyboardEvent): boolean {
  return event.key === "Enter" && (event.ctrlKey || event.metaKey);
}

export class DraftBox {
  readonly textarea: HTMLTextAreaElement;
  readonly lookups: HTMLElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly message: HTMLElement;
  private saving = false;
  private gone = false;
  private removing = false;

  constructor(
    parent: HTMLElement,
    text: string,
    private readonly save: () => void,
  ) {
    const label = parent.createEl("label", { cls: "dd-box-label", text: LABEL });
    this.textarea = label.createEl("textarea", {
      cls: "dd-box",
      placeholder: PLACEHOLDER,
      attr: { spellcheck: "false", rows: "8" },
    });
    this.textarea.value = text;
    parent.createEl("p", { cls: "dd-box-help", text: HELP });
    this.lookups = parent.createDiv();
    const row = parent.createDiv({ cls: "dd-save-row" });
    this.saveButton = row.createEl("button", { cls: "mod-cta dd-save", text: "Save" });
    row.createSpan({ cls: "dd-save-hint", text: SAVE_HINT });
    this.message = parent.createEl("p", { cls: "dd-save-message", attr: { "aria-live": "polite" } });
    this.saveButton.addEventListener("click", () => this.save());
    this.textarea.addEventListener("keydown", (event) => this.keyDown(event));
    this.refresh();
  }

  get text(): string {
    return this.textarea.value;
  }

  set text(text: string) {
    this.textarea.value = text;
    this.refresh();
  }

  setSaving(saving: boolean): void {
    this.saving = saving;
    this.refresh();
  }

  setGone(gone: boolean): void {
    this.gone = gone;
    this.refresh();
  }

  setRemoving(removing: boolean): void {
    this.removing = removing;
    this.refresh();
  }

  get isRemoving(): boolean {
    return this.removing;
  }

  say(message: string): void {
    this.message.setText(message);
  }

  get isGone(): boolean {
    return this.gone;
  }

  refresh(): void {
    const locked = this.saving || this.gone;
    this.textarea.readOnly = locked;
    this.saveButton.disabled = locked || this.removing || !hasLinesToSave(this.textarea.value);
  }

  focus(): void {
    this.textarea.focus();
  }

  private keyDown(event: KeyboardEvent): void {
    if (!isSaveKey(event)) return;
    event.preventDefault();
    this.save();
  }
}
