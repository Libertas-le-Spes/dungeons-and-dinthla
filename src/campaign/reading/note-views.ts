import { MarkdownView, type Workspace, type WorkspaceLeaf } from "obsidian";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { editorTextsOf } from "./editor-text";

class FoundViews {
  readonly views: MarkdownView[] = [];

  add(leaf: WorkspaceLeaf): void {
    if (leaf.view instanceof MarkdownView) this.views.push(leaf.view);
  }
}

export class NoteViews {
  constructor(
    private readonly workspace: Pick<Workspace, "iterateAllLeaves">,
    private readonly files: Pick<FencedFiles, "getFileByPath">,
  ) {}

  all(): MarkdownView[] {
    const found = new FoundViews();
    this.workspace.iterateAllLeaves(found.add.bind(found));
    return found.views;
  }

  textsAt(path: string): string[] {
    const file = this.files.getFileByPath(path);
    if (file === null) return [];
    return editorTextsOf(this.all(), file, this.files);
  }
}
