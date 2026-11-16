import type { MarkdownFileInfo, TFile } from "obsidian";
import type { FencedFiles } from "../../fence/gate/fenced-files";

export function editorTextOf(info: MarkdownFileInfo, file: TFile, files: Pick<FencedFiles, "getFileByPath">): string | null {
  const stillThatNote = info.file === file && files.getFileByPath(file.path) === file;
  if (!stillThatNote || info.editor === undefined) return null;
  return info.editor.getValue();
}

export function editorTextsOf(infos: MarkdownFileInfo[], file: TFile, files: Pick<FencedFiles, "getFileByPath">): string[] {
  const texts: string[] = [];
  for (const info of infos) {
    const text = editorTextOf(info, file, files);
    if (text !== null) texts.push(text);
  }
  return texts;
}
