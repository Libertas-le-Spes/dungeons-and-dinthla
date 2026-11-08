import { Modal, Notice, Setting, type App, type ButtonComponent } from "obsidian";
import { readCoinDraft, type CoinDraft, type Direction } from "../notes/coin-lines";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";

export interface CoinEntryChoices {
  draft: CoinDraft;
  remove(): Promise<boolean>;
}

const CONFIRM_MS = 4000;

export class CoinModal extends Modal {
  private readonly draft: CoinDraft;
  private confirmTimer: number | null = null;
  private changed = false;
  private reading: HTMLElement | null = null;
  private amountInput: HTMLInputElement | null = null;
  private busy = false;

  constructor(
    app: App,
    private readonly writesTo: string,
    private readonly add: (line: string) => Promise<boolean>,
    private readonly entry: CoinEntryChoices | null,
    private readonly onClosed: (changed: boolean) => void,
  ) {
    super(app);
    this.draft = { direction: "in", amount: "", what: "" };
    if (entry !== null) this.draft = { ...entry.draft };
  }

  override onOpen(): void {
    const { contentEl } = this;
    if (this.entry === null) this.setTitle("Add coin");
    else this.setTitle("Ledger entry");
    contentEl.addClass("dd-tokens", "dd-dialog");
    new Setting(contentEl).setName("Money").addDropdown((dropdown) => {
      dropdown.addOption("in", "In").addOption("out", "Out").setValue(this.draft.direction).onChange((value) => {
        this.draft.direction = value as Direction;
        this.showReading();
      });
      dropdown.selectEl.focus();
    });
    new Setting(contentEl).setName("Amount").addText((text) => {
      text.setPlaceholder("35 gp 4 sp").setValue(this.draft.amount).onChange((value) => {
        this.draft.amount = value;
        this.showReading();
      });
      text.inputEl.setAttr("aria-label", "Amount");
      this.saveOnEnter(text.inputEl);
      this.amountInput = text.inputEl;
    });
    new Setting(contentEl).setName("What for").addText((text) => {
      text.setPlaceholder("from the bandits at the ford").setValue(this.draft.what).onChange((value) => {
        this.draft.what = value;
        this.showReading();
      });
      text.inputEl.setAttr("aria-label", "What for");
      this.saveOnEnter(text.inputEl);
    });
    this.reading = contentEl.createEl("p", { cls: "dd-reading", attr: { "aria-live": "polite" } });
    let where = `Adds a line to ${this.writesTo}.`;
    if (this.entry !== null) where = `Saving replaces the entry's line in ${this.writesTo}.`;
    contentEl.createEl("p", { cls: "dd-where", text: where });
    const buttons = new Setting(contentEl)
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.save()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    const entry = this.entry;
    if (entry !== null) {
      buttons.addButton((button) => {
        button.setButtonText("Delete entry").setWarning().onClick(() => this.confirmDelete(button, entry));
        button.buttonEl.addClass("dd-delete");
      });
    }
    this.showReading();
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    if (this.confirmTimer !== null) window.clearTimeout(this.confirmTimer);
    this.contentEl.empty();
    this.onClosed(this.changed);
  }

  private confirmDelete(button: ButtonComponent, entry: CoinEntryChoices): void {
    if (this.confirmTimer === null) {
      button.setButtonText("Press again to delete");
      this.confirmTimer = window.setTimeout(() => {
        this.confirmTimer = null;
        button.setButtonText("Delete entry");
      }, CONFIRM_MS);
      return;
    }
    this.write(() => entry.remove());
  }

  private showReading(): void {
    if (this.reading === null) return;
    this.reading.removeClass("dd-error");
    if (this.draft.amount.trim() === "") {
      this.reading.setText("");
      return;
    }
    const reading = readCoinDraft(this.draft);
    if ("error" in reading) {
      this.reading.addClass("dd-error");
      this.reading.setText(reading.error);
      return;
    }
    this.reading.setText(reading.reads);
  }

  private saveOnEnter(input: HTMLInputElement): void {
    input.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || !isSubmit(event, false)) return;
      event.preventDefault();
      this.save();
    });
  }

  private save(): void {
    const reading = readCoinDraft(this.draft);
    if ("error" in reading) {
      this.showReading();
      if (this.amountInput !== null) this.amountInput.focus();
      return;
    }
    this.write(() => this.add(reading.line));
  }

  private write(change: () => Promise<boolean>): void {
    if (this.busy) return;
    this.busy = true;
    change()
      .then((wrote) => {
        this.busy = false;
        this.changed = wrote;
        this.close();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't change the coin: ${messageOf(error)}`);
      });
  }
}
