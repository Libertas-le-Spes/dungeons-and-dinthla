import { ButtonComponent, Setting, type App } from "obsidian";
import type { Source } from "../campaign/campaign";
import { CHANGED_IN_NOTE, PartlyWritten } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { isSubmit } from "../views/dialogs/keys";
import { messageOf } from "../views/dialogs/message-of";
import { deleteOnSecondPress } from "../views/dialogs/second-press";
import { ChangeDialog } from "../views/dialogs/change-dialog";
import type { SheetValue, ValueState } from "./character-sheet";
import { shownTextOf, STATE_WORDS } from "./character-sheet-page";
import type { ValueChoice } from "./sheet-value-writer";
import { isSheetName } from "./sheet-values";

export interface SheetValueDialog {
  character: string;
  notePath: string;
  value: SheetValue;
  sessionLabel: string | null;
  save(choice: ValueChoice): Promise<boolean>;
  openSource(source: Source): void;
}

const STATES: ValueState[] = ["learned", "override", "carried", "unknown"];

const CLEARING_STATES: ValueState[] = ["learned", "carried", "unknown"];

export function removesNoteLines(value: SheetValue, state: ValueState): boolean {
  return value.override !== null && !isSheetName(value.name) && CLEARING_STATES.includes(state);
}

export function notKnownOverCarriedText(label: string): string {
  return `Not known yet adds a ? line, which wins over the carried ${label.toLowerCase()} until a later line states it.`;
}

export function secondPressText(character: string, label: string): string {
  return `Learned at the table, Carried over and Not known yet remove ${label} from ${character}'s note, so they need a second press.`;
}

function stateOnEnter(state: ValueState): ValueState {
  if (state === "unknown") return "learned";
  return state;
}

export function earlierSourceOf(source: Source, notePath: string): string {
  if (source.path === notePath) return STATE_WORDS.override;
  return sessionLabelOf(source.path);
}

export function whereText(character: string, sessionLabel: string | null): string {
  let learned = "Learned at the table and Not known yet need a session to write in.";
  if (sessionLabel !== null) learned = `Learned at the table and Not known yet add a line to ${sessionLabel}.`;
  return `${learned} Override changes ${character}'s note.`;
}

export class SheetValueModal extends ChangeDialog {
  private typed: string;
  private valueInput: HTMLInputElement | null = null;

  constructor(
    app: App,
    private readonly dialog: SheetValueDialog,
    private readonly onClosed: () => void,
  ) {
    super(app);
    this.typed = "";
    if (dialog.value.state !== "unknown") this.typed = shownTextOf(dialog.value);
  }

  override onOpen(): void {
    const { contentEl } = this;
    const { value } = this.dialog;
    this.setTitle(value.label);
    contentEl.addClass("dd-tokens", "dd-dialog", "dd-sheet-dialog");
    new Setting(contentEl).setName("Value").addText((text) => {
      text.setPlaceholder("Value").setValue(this.typed).onChange((typed) => {
        this.typed = typed;
      });
      text.inputEl.setAttr("aria-label", "Value");
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || !isSubmit(event, false)) return;
        event.preventDefault();
        this.choose(stateOnEnter(value.state));
      });
      this.valueInput = text.inputEl;
      text.inputEl.focus();
    });
    this.addEarlier();
    const choices = contentEl.createDiv({ cls: "dd-state-choices" });
    for (const state of STATES) this.addChoice(choices, state);
    contentEl.createEl("p", { cls: "dd-where", text: whereText(this.dialog.character, this.dialog.sessionLabel) });
    if (value.carried !== null && value.learned === null) contentEl.createEl("p", { cls: "dd-where", text: notKnownOverCarriedText(value.label) });
    if (removesNoteLines(value, "learned")) contentEl.createEl("p", { cls: "dd-where", text: secondPressText(this.dialog.character, value.label) });
  }

  protected override closed(): void {
    this.onClosed();
  }

  protected override finished(): void {
    this.close();
  }

  protected override failed(error: unknown): void {
    if (error instanceof PartlyWritten || messageOf(error) === CHANGED_IN_NOTE) this.close();
    else if (this.valueInput !== null) this.valueInput.focus();
  }

  private addEarlier(): void {
    const { earlier } = this.dialog.value;
    if (earlier.length === 0) return;
    this.contentEl.createEl("p", { cls: "dd-detail", text: "Earlier values" });
    const list = this.contentEl.createEl("ul", { cls: "dd-earlier-list" });
    for (const line of [...earlier].reverse()) {
      const item = list.createEl("li");
      const link = item.createEl("a", { cls: "dd-source-link", text: `${line.value} · ${earlierSourceOf(line.source, this.dialog.notePath)}`, href: "#" });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.close();
        this.dialog.openSource(line.source);
      });
    }
  }

  private addChoice(parent: HTMLElement, state: ValueState): void {
    const button = new ButtonComponent(parent);
    button.buttonEl.addClass("dd-state-choice");
    button.buttonEl.setAttr("aria-pressed", String(state === this.dialog.value.state));
    button.buttonEl.setAttr("data-state", state);
    if (removesNoteLines(this.dialog.value, state)) {
      this.stopOnClose(deleteOnSecondPress(button, STATE_WORDS[state], () => this.choose(state)));
      return;
    }
    button.setButtonText(STATE_WORDS[state]).onClick(() => this.choose(state));
  }

  private choose(state: ValueState): void {
    this.runChange(() => this.dialog.save({ state, value: this.typed }), `Couldn't change the ${this.dialog.value.label.toLowerCase()}`);
  }
}
