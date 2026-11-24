import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import type { DialogView } from "../../../src/views/dialogs/dialog-view";
import type { ViewElement } from "../../../src/views/elements/view-element";
import { obsidianDocument } from "../../stubs/obsidian-dom";

export class MountedView implements DialogView {
  readonly into: HTMLElement;
  closedTimes = 0;

  constructor() {
    this.into = obsidianDocument().createElement("div");
    this.into.ownerDocument.body.append(this.into);
  }

  show(trees: readonly ViewElement[]): void {
    this.into.replaceChildren();
    for (const tree of trees) mountTree(tree, this.into);
  }

  close(): void {
    this.closedTimes += 1;
  }

  focused(): Element | null {
    return this.into.ownerDocument.activeElement;
  }
}
