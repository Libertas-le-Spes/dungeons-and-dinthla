import { Modal, type App } from "obsidian";
import type { DialogView, Dialogs, Focusable, ShownDialog } from "../../../views/dialogs/dialog-view";
import type { ViewElement } from "../../../views/elements/view-element";
import { AppKit, type MountKit } from "../mount/mount-kit";
import { mountTree } from "../mount/mount-tree";

const TOKENS_CLASS = "dd-tokens";

class FrameView implements DialogView {
  private pendingFocus: Focusable | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly kit: MountKit,
    private readonly closes: () => void,
  ) {}

  show(trees: readonly ViewElement[]): void {
    this.contentEl.empty();
    for (const tree of trees) mountTree(tree, this.contentEl, this.kit);
  }

  focusOnceOpen(target: Focusable): void {
    this.pendingFocus = target;
  }

  opened(): void {
    if (this.pendingFocus !== null) this.pendingFocus.focus();
    this.pendingFocus = null;
  }

  close(): void {
    this.closes();
  }
}

export class ModalFrame extends Modal {
  private view: FrameView | null = null;

  constructor(
    app: App,
    readonly dialog: ShownDialog,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(this.dialog.title);
    this.contentEl.addClass(TOKENS_CLASS, ...this.dialog.cls);
    const view = new FrameView(this.contentEl, new AppKit(this.app), this.close.bind(this));
    this.view = view;
    this.dialog.opened(view);
  }

  override open(): void {
    super.open();
    if (this.view !== null) this.view.opened();
  }

  override close(): void {
    if (!this.dialog.mayClose()) return;
    super.close();
  }

  override onClose(): void {
    this.view = null;
    this.contentEl.empty();
    this.dialog.closed();
  }
}

class FramedDialogs implements Dialogs {
  constructor(private readonly opens: (dialog: ShownDialog) => void) {}

  open(dialog: ShownDialog): void {
    this.opens(dialog);
  }
}

class FrameOpening {
  constructor(private readonly app: App) {}

  open(dialog: ShownDialog): void {
    new ModalFrame(this.app, dialog).open();
  }
}

export function obsidianDialogsOf(app: App): Dialogs {
  const opening = new FrameOpening(app);
  return new FramedDialogs(opening.open.bind(opening));
}
