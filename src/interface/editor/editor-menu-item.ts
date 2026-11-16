import type { WorkspaceLeaf } from "obsidian";
import { OPEN_IN_EDITOR } from "../../note-page/left-campaign";
import type { EditorStep } from "./editor-step";

const EDITOR_ICON = "file-pen-line";

export interface EditorItem {
  setTitle(title: string): EditorItem;
  setIcon(icon: string): EditorItem;
  onClick(click: () => unknown): EditorItem;
}

export interface EditorMenu {
  addItem(build: (item: EditorItem) => void): unknown;
}

class EditorOffer {
  constructor(
    private readonly step: EditorStep,
    private readonly path: string,
    private readonly leaf: WorkspaceLeaf,
  ) {}

  build(item: EditorItem): void {
    item.setTitle(OPEN_IN_EDITOR).setIcon(EDITOR_ICON).onClick(this.open.bind(this));
  }

  private open(): void {
    this.step.openIn(this.path, this.leaf);
  }
}

export function addEditorItem(menu: EditorMenu, step: EditorStep, shownPath: string | null, leaf: WorkspaceLeaf): void {
  const path = step.noteOf(shownPath);
  if (path === null) return;
  const offer = new EditorOffer(step, path, leaf);
  menu.addItem(offer.build.bind(offer));
}
