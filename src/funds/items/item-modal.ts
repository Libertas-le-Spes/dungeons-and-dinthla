import { choiceOf } from "../../views/dialogs/choice-of";
import { Setting, type App } from "obsidian";
import type { ItemRecord, Source } from "../../campaign/record/campaign";
import { isSubmit } from "../../views/dialogs/keys";
import { messageOf } from "../../views/dialogs/message-of";
import { RecordChangeDialog } from "../../views/dialogs/record-change-dialog";
import { holderNameOf } from "./item-groups";
import { asksHowMany, GONE_LINE_SAYS_MORE, type HolderOption, type ItemEdit, type ItemStatus } from "./item-plan";
import { ITEM_STATUSES, STATUS_WORDS } from "./status-words";

export class ItemModal extends RecordChangeDialog {
  private readonly edit: ItemEdit;
  private priceRow: HTMLElement | null = null;
  private howManyRow: HTMLElement | null = null;
  private openNoteButton: HTMLElement | null = null;

  constructor(
    app: App,
    private readonly item: ItemRecord,
    opened: ItemEdit,
    private readonly holders: HolderOption[],
    private readonly writesTo: string,
    private readonly save: (edit: ItemEdit) => Promise<boolean>,
    private readonly openNoteAt: (source: Source) => void,
    onClosed: (changed: boolean) => void,
  ) {
    super(app, onClosed);
    this.edit = { ...opened };
    const current = holders.find((option) => holderNameOf(option.text).toLowerCase() === holderNameOf(item.holder).toLowerCase());
    if (current !== undefined) this.edit.holder = current.text;
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle("Item");
    contentEl.addClass("dd-tokens", "dd-dialog");
    contentEl.createEl("p", { cls: "dd-subject", text: this.item.name });
    new Setting(contentEl).setName("Held by").addDropdown((dropdown) => {
      for (const option of this.holders) dropdown.addOption(option.text, option.label);
      dropdown.setValue(this.edit.holder).onChange((value) => {
        this.edit.holder = value;
        this.showHowMany();
      });
      dropdown.selectEl.focus();
    });
    new Setting(contentEl).setName("Status").addDropdown((dropdown) => {
      for (const [value, word] of Object.entries(STATUS_WORDS)) dropdown.addOption(value, word);
      dropdown.setValue(this.edit.status).onChange((value) => {
        const status = choiceOf(ITEM_STATUSES, value);
        if (status === undefined) return;
        this.edit.status = status;
        this.showPrice();
        this.showHowMany();
        this.hideOpenNote();
      });
    });
    if (asksHowMany(this.item)) this.addHowMany(contentEl);
    const price = new Setting(contentEl).setName("Sold for (adds it to the purse)").addText((text) => {
      text.setPlaceholder("150 gp").setValue(this.edit.price).onChange((value) => {
        this.edit.price = value;
        this.hideOpenNote();
      });
      text.inputEl.setAttr("aria-label", "Sold for");
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || !isSubmit(event, false)) return;
        event.preventDefault();
        this.saveEdit();
      });
    });
    this.priceRow = price.settingEl;
    this.showPrice();
    contentEl.createEl("p", { cls: "dd-where", text: `New lines go into ${this.writesTo}.` });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.saveEdit()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()))
      .addButton((button) => {
        button.setButtonText("Open note").onClick(() => this.openNote());
        button.buttonEl.toggle(false);
        this.openNoteButton = button.buttonEl;
      });
  }

  protected override failed(error: unknown): void {
    if (messageOf(error) === GONE_LINE_SAYS_MORE && this.openNoteButton !== null) this.openNoteButton.toggle(true);
    super.failed(error);
  }

  private addHowMany(contentEl: HTMLElement): void {
    const howMany = new Setting(contentEl).setName(`How many? (${this.item.held} held)`).addText((text) => {
      text.setValue(this.edit.howMany).onChange((value) => {
        this.edit.howMany = value;
      });
      text.inputEl.setAttr("aria-label", "How many");
    });
    this.howManyRow = howMany.settingEl;
    this.showHowMany();
  }

  private showHowMany(): void {
    if (this.howManyRow === null) return;
    const holderChanged = holderNameOf(this.edit.holder).toLowerCase() !== holderNameOf(this.item.holder).toLowerCase();
    this.howManyRow.toggle(this.edit.status !== "held" || holderChanged);
  }

  private showPrice(): void {
    if (this.priceRow === null) return;
    this.priceRow.toggle(this.edit.status === "sold");
  }

  private hideOpenNote(): void {
    if (this.openNoteButton === null) return;
    this.openNoteButton.toggle(false);
  }

  private openNote(): void {
    const gone = this.item.gone;
    this.close();
    if (gone !== null) this.openNoteAt(gone.source);
  }

  private saveEdit(): void {
    this.runChange(() => this.save(this.edit), "Couldn't change the item");
  }
}
