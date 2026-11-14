import { Modal, type App } from "obsidian";

export interface Closable {
  close(): void;
}

export interface DrawnContent {
  readonly title: string;
  draw(contentEl: HTMLElement, dialog: Closable): void;
  closed(): void;
}

export class DrawnModal extends Modal {
  constructor(
    app: App,
    private readonly content: DrawnContent,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(this.content.title);
    this.contentEl.addClass("dd-tokens");
    this.content.draw(this.contentEl, { close: this.close.bind(this) });
  }

  override onClose(): void {
    this.contentEl.empty();
    this.content.closed();
  }
}
