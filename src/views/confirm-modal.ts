import { Modal, type App } from "obsidian";

export interface ConfirmText {
  title: string;
  body: string;
  confirm: string;
  keep: string;
}

export type OpenConfirm = (text: ConfirmText, confirmed: () => void, closed: () => void) => void;

export class ConfirmModal extends Modal {
  private keepButton: HTMLButtonElement | null = null;

  constructor(
    app: App,
    private readonly text: ConfirmText,
    private readonly confirmed: () => void,
    private readonly closed: () => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle(this.text.title);
    contentEl.addClass("dd-tokens", "dd-confirm");
    contentEl.createEl("p", { cls: "dd-confirm-body", text: this.text.body });
    const row = contentEl.createDiv({ cls: "modal-button-container" });
    const confirm = row.createEl("button", { cls: "mod-warning dd-confirm-yes", text: this.text.confirm });
    const keep = row.createEl("button", { cls: "dd-confirm-keep", text: this.text.keep });
    confirm.addEventListener("click", () => this.confirm());
    keep.addEventListener("click", () => this.close());
    this.keepButton = keep;
  }

  override open(): void {
    super.open();
    this.focusKeep();
  }

  override onClose(): void {
    this.keepButton = null;
    this.contentEl.empty();
    this.closed();
  }

  private focusKeep(): void {
    if (this.keepButton === null) return;
    this.keepButton.focus();
  }

  private confirm(): void {
    this.close();
    this.confirmed();
  }
}
