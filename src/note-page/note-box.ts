import { isSubmit } from "../views/keys";
import { SecondPress } from "../views/second-press";

const LABEL = "The note's text";
const SAVE_HINT = "Ctrl + Enter saves";
const RELOAD = "Load the note again";
const RELOAD_ARMED = "Press again to drop what you typed";

export interface BoxMoves {
  save(): void;
  typed(): void;
  reload(): void;
}

export class NoteBox {
  readonly textarea: HTMLTextAreaElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly reloadButton: HTMLButtonElement;
  private readonly reloadPress: SecondPress;
  private readonly message: HTMLElement;
  private saving = false;
  private ready = false;
  private unsaved = false;

  constructor(
    parent: HTMLElement,
    private readonly moves: BoxMoves,
  ) {
    const label = parent.createEl("label", { cls: "dd-box-label", text: LABEL });
    this.textarea = label.createEl("textarea", { cls: "dd-box dd-note-box", attr: { spellcheck: "false", rows: "16" } });
    const row = parent.createDiv({ cls: "dd-save-row" });
    this.saveButton = row.createEl("button", { cls: "mod-cta dd-save", text: "Save" });
    row.createSpan({ cls: "dd-save-hint", text: SAVE_HINT });
    this.reloadButton = row.createEl("button", { cls: "dd-create dd-reload", text: RELOAD });
    this.message = parent.createEl("p", { cls: "dd-save-message", attr: { "aria-live": "polite" } });
    this.reloadPress = new SecondPress((armed) => this.showReloadArmed(armed), () => moves.reload());
    this.saveButton.addEventListener("click", () => moves.save());
    this.reloadButton.addEventListener("click", () => this.reloadPress.press());
    this.textarea.addEventListener("keydown", (event) => this.keyDown(event));
    this.textarea.addEventListener("input", () => moves.typed());
    this.offerReload(false);
    this.refresh();
  }

  get text(): string {
    return this.textarea.value;
  }

  set text(text: string) {
    this.textarea.value = text;
  }

  setReady(ready: boolean): void {
    this.ready = ready;
    this.refresh();
  }

  setSaving(saving: boolean): void {
    this.saving = saving;
    this.refresh();
  }

  setUnsaved(unsaved: boolean): void {
    this.unsaved = unsaved;
    this.refresh();
  }

  say(message: string): void {
    this.message.setText(message);
  }

  offerReload(offered: boolean): void {
    this.reloadPress.stop();
    this.reloadButton.toggle(offered);
  }

  focus(): void {
    this.textarea.focus();
  }

  close(): void {
    this.reloadPress.stop();
  }

  private refresh(): void {
    this.textarea.readOnly = this.saving || !this.ready;
    this.saveButton.disabled = this.saving || !this.ready || !this.unsaved;
  }

  private showReloadArmed(armed: boolean): void {
    if (armed) this.reloadButton.setText(RELOAD_ARMED);
    else this.reloadButton.setText(RELOAD);
  }

  private keyDown(event: KeyboardEvent): void {
    if (!isSubmit(event, true)) return;
    event.preventDefault();
    this.moves.save();
  }
}
