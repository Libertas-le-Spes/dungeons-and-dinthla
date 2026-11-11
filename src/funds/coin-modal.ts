import { choiceOf } from "../views/dialogs/choice-of";
import { Setting, type App } from "obsidian";
import { readCoinDraft, type CoinDraft, type CoinLine, type Direction } from "../notes/coin-lines";
import { isSubmit } from "../views/dialogs/keys";
import { deleteOnSecondPress } from "../views/dialogs/second-press";
import { ChangeDialog } from "../views/dialogs/change-dialog";
import type { CoinEntryChoices } from "./coin-entry";

export type CoinOutcome = "unchanged" | "written" | "deleted";

const DIRECTIONS: Direction[] = ["in", "out"];

export class CoinModal extends ChangeDialog {
  private readonly draft: CoinDraft;
  private outcome: CoinOutcome = "unchanged";
  private reading: HTMLElement | null = null;
  private amountInput: HTMLInputElement | null = null;

  constructor(
    app: App,
    private readonly writesTo: string,
    private readonly save: (written: CoinLine) => Promise<boolean>,
    private readonly entry: CoinEntryChoices | null,
    private readonly openNote: (() => void) | null,
    private readonly onClosed: (outcome: CoinOutcome) => void,
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
        const direction = choiceOf(DIRECTIONS, value);
        if (direction === undefined) return;
        this.draft.direction = direction;
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
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.submit()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    const openNote = this.openNote;
    if (openNote !== null && this.cannotSave() !== null) {
      buttons.addButton((button) =>
        button.setButtonText("Open note").onClick(() => {
          this.close();
          openNote();
        }),
      );
    }
    const entry = this.entry;
    if (entry !== null) {
      buttons.addButton((button) => {
        this.stopOnClose(deleteOnSecondPress(button, "Delete entry", () => this.saveAs("deleted", () => entry.delete())));
      });
    }
    this.showReading();
  }

  protected override closed(): void {
    this.onClosed(this.outcome);
  }

  protected override finished(): void {
    this.close();
  }

  protected override failed(): void {}

  private showReading(): void {
    if (this.reading === null) return;
    this.reading.removeClass("dd-error");
    const cannotSave = this.cannotSave();
    if (cannotSave !== null) {
      this.reading.addClass("dd-error");
      this.reading.setText(cannotSave);
      return;
    }
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
      this.submit();
    });
  }

  private cannotSave(): string | null {
    if (this.entry === null) return null;
    return this.entry.cannotSave;
  }

  private submit(): void {
    const reading = readCoinDraft(this.draft);
    if (this.cannotSave() !== null || "error" in reading) {
      this.showReading();
      if (this.amountInput !== null) this.amountInput.focus();
      return;
    }
    this.saveAs("written", () => this.save(reading));
  }

  private failureText(): string {
    if (this.entry === null) return "Couldn't add the coin";
    return "Couldn't change the entry";
  }

  private saveAs(done: CoinOutcome, change: () => Promise<boolean>): void {
    this.runChange(() => this.noting(done, change), this.failureText());
  }

  private async noting(done: CoinOutcome, change: () => Promise<boolean>): Promise<boolean> {
    const wrote = await change();
    if (wrote) this.outcome = done;
    return wrote;
  }
}
