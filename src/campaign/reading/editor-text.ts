import type { MarkdownFileInfo, TFile } from "obsidian";
import type { FencedFiles } from "../../fence/fenced-files";

export function editorTextOf(info: MarkdownFileInfo, file: TFile, files: Pick<FencedFiles, "getFileByPath">): string | null {
  const stillThatNote = info.file === file && files.getFileByPath(file.path) === file;
  if (!stillThatNote || info.editor === undefined) return null;
  return info.editor.getValue();
}
