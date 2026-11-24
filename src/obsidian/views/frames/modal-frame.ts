import { Modal, type App } from "obsidian";
import type { DialogView, Dialogs, ShownDialog } from "../../../views/dialogs/dialog-view";
import type { ViewElement } from "../../../views/elements/view-element";
import { mountTree } from "../mount/mount-tree";

const TOKENS_CLASS = "dd-tokens";

class FrameView implements DialogView {
  constructor(
    private readonly contentEl: HTMLElement,
    private readonly closes: () => void,
  ) {}

  show(trees: readonly ViewElement[]): void {
    this.contentEl.empty();
    for (const tree of trees) mountTree(tree, this.contentEl);
  }

  close(): void {
    this.closes();
  }
}

export class ModalFrame extends Modal {
  constructor(
    app: App,
    readonly dialog: ShownDialog,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(this.dialog.title);
    this.contentEl.addClass(TOKENS_CLASS, ...this.dialog.cls);
    this.dialog.opened(new FrameView(this.contentEl, this.close.bind(this)));
  }

  override close(): void {
    if (!this.dialog.mayClose()) return;
    super.close();
  }

  override onClose(): void {
    this.contentEl.empty();
    this.dialog.closed();
  }
}

export class ObsidianDialogs implements Dialogs {
  constructor(private readonly app: App) {}

  open(dialog: ShownDialog): void {
    new ModalFrame(this.app, dialog).open();
  }
}
