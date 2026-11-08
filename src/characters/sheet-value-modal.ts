import { Modal, Notice, Setting, type App } from "obsidian";
import type { Source } from "../campaign/campaign";
import { CHANGED_IN_NOTE, PartlyWritten } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import type { SheetValue, ValueState } from "./character-sheet";
import { shownTextOf, STATE_WORDS } from "./character-sheet-view";
import type { ValueChoice } from "./sheet-value-writer";

export interface SheetValueDialog {
  character: string;
  notePath: string;
  value: SheetValue;
  sessionLabel: string | null;
  save(choice: ValueChoice): Promise<boolean>;
  openSource(source: Source): void;
}

const STATES: ValueState[] = ["learned", "override", "carried", "unknown"];

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

export class SheetValueModal extends Modal {
  private typed: string;
  private valueInput: HTMLInputElement | null = null;
  private busy = false;

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
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    this.contentEl.empty();
    this.onClosed();
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
    const pressed = String(state === this.dialog.value.state);
    const button = parent.createEl("button", { cls: "dd-state-choice", attr: { "aria-pressed": pressed, "data-state": state } });
    button.createSpan({ cls: ["dd-state-dot", `dd-state-${state}`] });
    button.appendText(STATE_WORDS[state]);
    button.addEventListener("click", () => this.choose(state));
  }

  private choose(state: ValueState): void {
    if (this.busy) return;
    this.busy = true;
    this.dialog
      .save({ state, value: this.typed })
      .then(() => {
        this.busy = false;
        this.close();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't change the ${this.dialog.value.label.toLowerCase()}: ${messageOf(error)}`);
        if (error instanceof PartlyWritten || messageOf(error) === CHANGED_IN_NOTE) this.close();
        else if (this.valueInput !== null) this.valueInput.focus();
      });
  }
}
