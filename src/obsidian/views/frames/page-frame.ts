import { Component } from "obsidian";
import type { PageView, ShownPage } from "../../../views/pages/page-view";
import type { ViewElement } from "../../../views/elements/view-element";
import type { MountKit } from "../mount/mount-kit";
import { mountTree } from "../mount/mount-tree";

const TOKENS_CLASS = "dd-tokens";

class FramePage implements PageView {
  constructor(
    private readonly contentEl: HTMLElement,
    private readonly kit: MountKit,
  ) {}

  show(trees: readonly ViewElement[]): void {
    this.contentEl.empty();
    for (const tree of trees) mountTree(tree, this.contentEl, this.kit);
  }
}

export class PageFrame extends Component {
  constructor(
    private readonly contentEl: HTMLElement,
    readonly page: ShownPage,
    private readonly kit: MountKit,
  ) {
    super();
  }

  override onload(): void {
    this.contentEl.empty();
    this.contentEl.addClass(TOKENS_CLASS, ...this.page.cls);
    this.page.opened(new FramePage(this.contentEl, this.kit));
  }

  override onunload(): void {
    this.page.closed();
  }
}
