import { Modal, Notice, Setting, type App } from "obsidian";
import type { ItemRecord, Source } from "../campaign/campaign";
import { PartlyWritten } from "../campaign/note-editor";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import { holderNameOf } from "./item-groups";
import { GONE_LINE_SAYS_MORE, type HolderOption, type ItemEdit, type ItemStatus } from "./item-plan";

const STATUS_WORDS: Record<ItemStatus, string> = { held: "Held", sold: "Sold", used: "Used up", lost: "Lost" };

export class ItemModal extends Modal {
  private readonly edit: ItemEdit;
  private changed = false;
  private busy = false;
  private priceRow: HTMLElement | null = null;
  private openNoteButton: HTMLElement | null = null;

  constructor(
    app: App,
    private readonly item: ItemRecord,
    opened: ItemEdit,
    private readonly holders: HolderOption[],
    private readonly writesTo: string,
    private readonly save: (edit: ItemEdit) => Promise<boolean>,
    private readonly openLine: (source: Source) => void,
    private readonly onClosed: (changed: boolean) => void,
  ) {
    super(app);
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
      });
      dropdown.selectEl.focus();
    });
    new Setting(contentEl).setName("Status").addDropdown((dropdown) => {
      for (const [value, word] of Object.entries(STATUS_WORDS)) dropdown.addOption(value, word);
      dropdown.setValue(this.edit.status).onChange((value) => {
        this.edit.status = value as ItemStatus;
        this.showPrice();
        this.hideOpenNote();
      });
    });
    const price = new Setting(contentEl).setName("Sold for (adds it to the purse)").addText((text) => {
      text.setPlaceholder("150 gp").setValue(this.edit.price).onChange((value) => {
        this.edit.price = value;
        this.hideOpenNote();
      });
      text.inputEl.setAttr("aria-label", "Sold for");
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || !isSubmit(event, false)) return;
        event.preventDefault();
        this.run();
      });
    });
    this.priceRow = price.settingEl;
    this.showPrice();
    contentEl.createEl("p", { cls: "dd-where", text: `New lines go into ${this.writesTo}.` });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.run()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()))
      .addButton((button) => {
        button.setButtonText("Open note").onClick(() => this.openTheNote());
        button.buttonEl.toggle(false);
        this.openNoteButton = button.buttonEl;
      });
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    this.contentEl.empty();
    this.onClosed(this.changed);
  }

  private showPrice(): void {
    if (this.priceRow === null) return;
    this.priceRow.toggle(this.edit.status === "sold");
  }

  private hideOpenNote(): void {
    if (this.openNoteButton === null) return;
    this.openNoteButton.toggle(false);
  }

  private openTheNote(): void {
    const gone = this.item.gone;
    this.close();
    if (gone !== null) this.openLine(gone.source);
  }

  private run(): void {
    if (this.busy) return;
    this.busy = true;
    this.save(this.edit)
      .then((wrote) => {
        this.busy = false;
        this.changed = wrote;
        this.close();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't change the item: ${messageOf(error)}`);
        if (messageOf(error) === GONE_LINE_SAYS_MORE && this.openNoteButton !== null) this.openNoteButton.toggle(true);
        if (!(error instanceof PartlyWritten)) return;
        this.changed = true;
        this.close();
      });
  }
}
