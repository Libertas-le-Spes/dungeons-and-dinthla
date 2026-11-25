import { hasLinesToSave } from "../drafts/draft-lines";
import type { CaretWatcher } from "../../views/elements/bindings/binding-wiring";
import { CaretBinding, EnterBinding, HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Label, Paragraph, Span } from "../../views/elements/kinds/containers";
import { TextArea } from "../../views/elements/kinds/fields";
import type { ViewElement } from "../../views/elements/view-element";
import type { BoxState } from "./box-lookup";

const LABEL = "Type a line starting with ? ! or $, and link names with [[ ]]";
const PLACEHOLDER = "! Find the caravan, from: [[Lady Vess]], reward: 200 gp";
const HELP = "Start with ??, !! or $$ to find an earlier line.";
const SAVE_HINT = "Ctrl + Enter saves";
const BOX_ROWS = 8;

export class DraftBox implements BoxState {
  private readonly area = new KeptHandle();
  private readonly saveButton = new KeptHandle();
  private readonly message = new KeptHandle();
  private value: string;
  private at: number;
  private saving = false;
  private gone = false;
  private removing = false;

  constructor(
    text: string,
    private readonly save: () => void,
  ) {
    this.value = text;
    this.at = text.length;
  }

  trees(watcher: CaretWatcher, lookups: ViewElement): ViewElement[] {
    const save = new RunAction(this.pressedSave.bind(this));
    const area = new TextArea({
      cls: ["dd-box"],
      placeholder: PLACEHOLDER,
      spellcheck: false,
      value: this.value,
      bindings: [new EnterBinding(true, save), new CaretBinding(watcher), new HandleRequest(this.area)],
    }, BOX_ROWS);
    const row = new Div({ cls: ["dd-save-row"] }, [
      new Button({ cls: ["mod-cta", "dd-save"], text: "Save", bindings: [new PressBinding(save), new HandleRequest(this.saveButton)] }),
      new Span({ cls: ["dd-save-hint"], text: SAVE_HINT }),
    ]);
    return [
      new Label({ cls: ["dd-box-label"], text: LABEL }, [new Span({ cls: ["dd-box-frame"] }, [area])]),
      new Paragraph({ cls: ["dd-box-help"], text: HELP }),
      new Div({}, [lookups]),
      row,
      new Paragraph({ cls: ["dd-save-message"], live: "polite", bindings: [new HandleRequest(this.message)] }),
    ];
  }

  get text(): string {
    return this.value;
  }

  set text(text: string) {
    this.value = text;
    this.at = text.length;
    this.area.setValue(text);
    this.refresh();
  }

  get caret(): number {
    return this.at;
  }

  took(text: string, caret: number): void {
    this.value = text;
    this.at = caret;
  }

  caretAt(caret: number): void {
    this.at = caret;
  }

  placeCaret(caret: number): void {
    this.at = caret;
    this.area.placeCaret(caret);
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
    this.area.setReadOnly(locked);
    this.saveButton.setDisabled(locked || this.removing || !hasLinesToSave(this.value));
  }

  focus(): void {
    this.area.focus();
  }

  private pressedSave(): void {
    this.save();
  }
}
