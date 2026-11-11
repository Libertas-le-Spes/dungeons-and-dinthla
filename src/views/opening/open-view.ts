import type { App } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import type { Gate } from "../../fence/gatekeeper";

export function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export async function openSource(app: App, gate: Gate, source: Source): Promise<void> {
  const file = gate.files.getFileByPath(source.path);
  if (file === null) return;
  await app.workspace.getLeaf(false).openFile(file, { eState: { line: source.line } });
}
