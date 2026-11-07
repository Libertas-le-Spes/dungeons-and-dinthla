import type { MarkdownFileInfo, TFile, Vault } from "obsidian";

export function editorTextOf(info: MarkdownFileInfo, file: TFile, vault: Pick<Vault, "getFileByPath">): string | null {
  const stillThatNote = info.file === file && vault.getFileByPath(file.path) === file;
  if (!stillThatNote || info.editor === undefined) return null;
  return info.editor.getValue();
}
