import type { App } from "obsidian";
import type { Source } from "../campaign/campaign";

export function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export async function openSource(app: App, source: Source): Promise<void> {
  const file = app.vault.getFileByPath(source.path);
  if (file === null) return;
  await app.workspace.getLeaf(false).openFile(file, { eState: { line: source.line } });
}

export async function openMainView(app: App, viewType: string): Promise<void> {
  const [open] = app.workspace.getLeavesOfType(viewType);
  if (open !== undefined) {
    await app.workspace.revealLeaf(open);
    return;
  }
  await app.workspace.getLeaf("tab").setViewState({ type: viewType, active: true });
}

export async function openSideView(app: App, viewType: string): Promise<void> {
  const [open] = app.workspace.getLeavesOfType(viewType);
  if (open !== undefined) {
    await app.workspace.revealLeaf(open);
    return;
  }
  const leaf = app.workspace.getRightLeaf(false);
  if (leaf === null) return;
  await leaf.setViewState({ type: viewType, active: true });
  await app.workspace.revealLeaf(leaf);
}
