import { Modal, Notice, Setting, type App } from "obsidian";
import { readCoinDraft, type CoinDraft, type Direction } from "../notes/coin-lines";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";

export class CoinModal extends Modal {
  private readonly draft: CoinDraft = { direction: "in", amount: "", what: "" };
  private reading: HTMLElement | null = null;
  private amountInput: HTMLInputElement | null = null;
  private busy = false;

  constructor(
    app: App,
    private readonly writesTo: string,
    private readonly add: (line: string) => Promise<boolean>,
    private readonly onClosed: () => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle("Add coin");
    contentEl.addClass("dd-tokens", "dd-dialog");
    new Setting(contentEl).setName("Money").addDropdown((dropdown) => {
      dropdown.addOption("in", "In").addOption("out", "Out").setValue("in").onChange((value) => {
        this.draft.direction = value as Direction;
        this.showReading();
      });
      dropdown.selectEl.focus();
    });
    new Setting(contentEl).setName("Amount").addText((text) => {
      text.setPlaceholder("35 gp 4 sp").onChange((value) => {
        this.draft.amount = value;
        this.showReading();
      });
      text.inputEl.setAttr("aria-label", "Amount");
      this.saveOnEnter(text.inputEl);
      this.amountInput = text.inputEl;
    });
    new Setting(contentEl).setName("What for").addText((text) => {
      text.setPlaceholder("from the bandits at the ford").onChange((value) => {
        this.draft.what = value;
        this.showReading();
      });
      text.inputEl.setAttr("aria-label", "What for");
      this.saveOnEnter(text.inputEl);
    });
    this.reading = contentEl.createEl("p", { cls: "dd-reading", attr: { "aria-live": "polite" } });
    contentEl.createEl("p", { cls: "dd-where", text: `Adds a line to ${this.writesTo}.` });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.save()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    this.contentEl.empty();
    this.onClosed();
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
    if (this.busy) return;
    this.busy = true;
    this.add(reading.line)
      .then((added) => {
        this.busy = false;
        if (added) this.close();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't add the coin: ${messageOf(error)}`);
      });
  }
}
