import { OPEN_IN_EDITOR } from "../../note-page/left-campaign";

const EDITOR_ICON = "file-pen-line";

export interface EditorStep {
  noteOf(path: string | null): string | null;
  open(path: string): void;
}

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
  ) {}

  build(item: EditorItem): void {
    item.setTitle(OPEN_IN_EDITOR).setIcon(EDITOR_ICON).onClick(this.open.bind(this));
  }

  private open(): void {
    this.step.open(this.path);
  }
}

export function addEditorItem(menu: EditorMenu, step: EditorStep, shownPath: string | null): void {
  const path = step.noteOf(shownPath);
  if (path === null) return;
  const offer = new EditorOffer(step, path);
  menu.addItem(offer.build.bind(offer));
}

export function openShownInEditor(step: EditorStep, shownPath: string | null, checking: boolean): boolean {
  const path = step.noteOf(shownPath);
  if (path === null) return false;
  if (!checking) step.open(path);
  return true;
}
