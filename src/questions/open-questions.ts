import type { App } from "obsidian";
import type { Source } from "../campaign/campaign";
import { QUESTIONS_VIEW } from "./questions-view";

export async function openSource(app: App, source: Source): Promise<void> {
  const file = app.vault.getFileByPath(source.path);
  if (file === null) return;
  await app.workspace.getLeaf(false).openFile(file, { eState: { line: source.line } });
}

export async function openQuestionsView(app: App): Promise<void> {
  const [open] = app.workspace.getLeavesOfType(QUESTIONS_VIEW);
  if (open !== undefined) {
    await app.workspace.revealLeaf(open);
    return;
  }
  const leaf = app.workspace.getRightLeaf(false);
  if (leaf === null) return;
  await leaf.setViewState({ type: QUESTIONS_VIEW, active: true });
  await app.workspace.revealLeaf(leaf);
}
