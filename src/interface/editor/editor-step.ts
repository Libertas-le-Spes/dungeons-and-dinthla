import type { WorkspaceLeaf } from "obsidian";

export interface EditorStep {
  noteOf(path: string | null): string | null;
  openIn(path: string, leaf: WorkspaceLeaf): void;
}
