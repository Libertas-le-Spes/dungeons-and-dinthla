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
