import type { MarkdownPostProcessorContext, MarkdownSectionInformation } from "obsidian";
import type { NoteLines } from "../../reading/note-lines";

const LINE_BREAK = "\n";

export type SectionSource = Pick<MarkdownPostProcessorContext, "getSectionInfo">;

function linesOf(section: MarkdownSectionInformation, noteLines: NoteLines): string[] {
  const lines: string[] = [];
  for (const [number, line] of noteLines.of(section.text).entries()) {
    if (number >= section.lineStart && number <= section.lineEnd) lines.push(line);
  }
  return lines;
}

export function sectionTextOf(root: HTMLElement, source: SectionSource, noteLines: NoteLines): string | null {
  const section = source.getSectionInfo(root);
  if (section === null) return null;
  return linesOf(section, noteLines).join(LINE_BREAK);
}
