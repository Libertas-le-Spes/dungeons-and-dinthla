import { choiceOf } from "../views/choice-of";
import { Setting, type App } from "obsidian";
import type { ItemRecord, Source } from "../campaign/campaign";
import { PartlyWritten } from "../campaign/note-editor";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import { TrackedDialog } from "../views/tracked-dialog";
import { holderNameOf } from "./item-groups";
import { GONE_LINE_SAYS_MORE, type HolderOption, type ItemEdit, type ItemStatus } from "./item-plan";
import { ITEM_STATUSES, STATUS_WORDS } from "./status-words";

export class ItemModal extends TrackedDialog {
  private readonly edit: ItemEdit;
  private changed = false;
  private priceRow: HTMLElement | null = null;
  private openNoteButton: HTMLElement | null = null;

  constructor(
    app: App,
    private readonly item: ItemRecord,
    opened: ItemEdit,
    private readonly holders: HolderOption[],
    private readonly writesTo: string,
    private readonly save: (edit: ItemEdit) => Promise<boolean>,
    private readonly openNoteAt: (source: Source) => void,
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
        const status = choiceOf(ITEM_STATUSES, value);
        if (status === undefined) return;
        this.edit.status = status;
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

  protected override closed(): void {
    this.onClosed(this.changed);
  }

  protected override finished(wrote: boolean): void {
    this.changed = wrote;
    this.close();
  }

  protected override failed(error: unknown): void {
    if (messageOf(error) === GONE_LINE_SAYS_MORE && this.openNoteButton !== null) this.openNoteButton.toggle(true);
    if (!(error instanceof PartlyWritten)) return;
    this.changed = true;
    this.close();
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
    this.run(() => this.save(this.edit), "Couldn't change the item");
  }
}
