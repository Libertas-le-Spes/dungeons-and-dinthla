import { Modal, type App } from "obsidian";

export interface ConfirmText {
  title: string;
  body: string;
  confirm: string;
  keep: string;
}

export type OpenConfirm = (text: ConfirmText, confirmed: () => void) => void;

export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private readonly text: ConfirmText,
    private readonly confirmed: () => void,
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
    keep.focus();
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private confirm(): void {
    this.close();
    this.confirmed();
  }
}
