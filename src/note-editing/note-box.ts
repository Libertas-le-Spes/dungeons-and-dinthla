import { SecondPress } from "../views/dialogs/second-press";
import { ChangeBinding, EnterBinding, HandleRequest, PressBinding } from "../views/elements/bindings/bindings";
import type { TextChange } from "../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import { RunAction } from "../views/elements/bindings/run-action";
import { Button, Div, Label, Paragraph, Span } from "../views/elements/kinds/containers";
import { TextArea } from "../views/elements/kinds/fields";
import type { ViewElement } from "../views/elements/view-element";

const LABEL = "The note's text";
const SAVE_HINT = "Ctrl + Enter saves";
const RELOAD = "Load the note again";
const RELOAD_ARMED = "Press again to drop what you typed";
const BOX_ROWS = 16;

export interface BoxMoves {
  save(): void;
  typed(): void;
  reload(): void;
}

export class NoteBox implements TextChange {
  private readonly area = new KeptHandle();
  private readonly saveButton = new KeptHandle();
  private readonly reloadButton = new KeptHandle();
  private readonly message = new KeptHandle();
  private readonly reloadPress: SecondPress;
  private value = "";
  private saving = false;
  private ready = false;
  private unsaved = false;

  constructor(private readonly moves: BoxMoves) {
    this.reloadPress = new SecondPress(this.showReloadArmed.bind(this), moves.reload.bind(moves));
  }

  trees(): ViewElement[] {
    const save = new RunAction(this.save.bind(this));
    const area = new TextArea({ cls: ["dd-box", "dd-note-box"], spellcheck: false, bindings: [new ChangeBinding(this), new EnterBinding(true, save), new HandleRequest(this.area)] }, BOX_ROWS);
    const row = new Div({ cls: ["dd-save-row"] }, [
      new Button({ cls: ["mod-cta", "dd-save"], text: "Save", bindings: [new PressBinding(save), new HandleRequest(this.saveButton)] }),
      new Span({ cls: ["dd-save-hint"], text: SAVE_HINT }),
      new Button({ cls: ["dd-create", "dd-reload"], text: RELOAD, bindings: [new PressBinding(new RunAction(this.pressReload.bind(this))), new HandleRequest(this.reloadButton)] }),
    ]);
    return [new Label({ cls: ["dd-box-label"], text: LABEL }, [area]), row, new Paragraph({ cls: ["dd-save-message"], live: "polite", bindings: [new HandleRequest(this.message)] })];
  }

  shown(): void {
    this.offerReload(false);
    this.refresh();
  }

  get text(): string {
    return this.value;
  }

  set text(text: string) {
    this.value = text;
    this.area.setValue(text);
  }

  changed(value: string): void {
    if (value === this.value) return;
    this.value = value;
    this.moves.typed();
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
    this.reloadButton.setHidden(!offered);
  }

  focus(): void {
    this.area.focus();
  }

  close(): void {
    this.reloadPress.stop();
  }

  private save(): void {
    this.moves.save();
  }

  private pressReload(): void {
    this.reloadPress.press();
  }

  private refresh(): void {
    this.area.setReadOnly(this.saving || !this.ready);
    this.saveButton.setDisabled(this.saving || !this.ready || !this.unsaved);
  }

  private showReloadArmed(armed: boolean): void {
    if (armed) this.reloadButton.setText(RELOAD_ARMED);
    else this.reloadButton.setText(RELOAD);
  }
}
