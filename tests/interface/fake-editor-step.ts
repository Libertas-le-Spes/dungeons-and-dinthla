import type { WorkspaceLeaf } from "obsidian";
import type { EditorStep } from "../../src/interface/editor/editor-step";

export interface OpenedIn {
  path: string;
  leaf: WorkspaceLeaf;
}

export class FakeEditorStep implements EditorStep {
  readonly asked: (string | null)[] = [];
  readonly opened: OpenedIn[] = [];

  constructor(private readonly notes: string[]) {}

  noteOf(path: string | null): string | null {
    this.asked.push(path);
    if (path === null || !this.notes.includes(path)) return null;
    return path;
  }

  openIn(path: string, leaf: WorkspaceLeaf): void {
    this.opened.push({ path, leaf });
  }
}
