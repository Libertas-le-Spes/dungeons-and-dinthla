import type { MarkdownPostProcessorContext, MarkdownSectionInformation } from "obsidian";

const LINE_BREAK = "\n";

export type SectionSource = Pick<MarkdownPostProcessorContext, "getSectionInfo">;

function linesOf(section: MarkdownSectionInformation): string[] {
  const lines: string[] = [];
  for (const [number, line] of section.text.split(LINE_BREAK).entries()) {
    if (number >= section.lineStart && number <= section.lineEnd) lines.push(line);
  }
  return lines;
}

export function sectionTextOf(root: HTMLElement, source: SectionSource): string | null {
  const section = source.getSectionInfo(root);
  if (section === null) return null;
  return linesOf(section).join(LINE_BREAK);
}
