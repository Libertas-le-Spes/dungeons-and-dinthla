import type { PrintedSheet } from "../../../../beyond/sheet/printed-sheet";
import type { PluginSection } from "../../../layout/plugin-section";
import type { NoteLayout } from "../../reading/note-layout";
import { SECTION_CONTENTS } from "../../sections/contents/section-contents";
import type { SectionContent } from "../../sections/contents/section-content";
import { blockOf } from "./block-of";


function contentFor(section: PluginSection): SectionContent {
  for (const content of SECTION_CONTENTS) {
    if (content.section === section) return content;
  }
  throw new Error(`No content is written for ${section.heading}.`);
}

function replacedSections(layout: NoteLayout, sheet: PrintedSheet): { lines: string[]; cursor: number } {
  let lines: string[] = [];
  let cursor = layout.bodyStart;
  for (const span of layout.spans) {
    const block = blockOf(span.section, contentFor(span.section).linesOf(sheet), layout.ending);
    lines = lines.concat(layout.lines.slice(cursor, span.start), block);
    cursor = span.end;
  }
  return { lines, cursor };
}

function missingBlocks(layout: NoteLayout, sheet: PrintedSheet): string[] {
  let blocks: string[] = [];
  for (const content of SECTION_CONTENTS) {
    if (layout.spanOf(content.section) !== null) continue;
    blocks = blocks.concat(blockOf(content.section, content.linesOf(sheet), layout.ending));
  }
  return blocks;
}

function withBlocksBeforeTheFinalBreak(lines: readonly string[], blocks: readonly string[]): string[] {
  const endsInBreak = lines.length > 0 && lines.lastIndexOf("") === lines.length - 1;
  if (!endsInBreak) return lines.concat(blocks);
  return lines.slice(0, lines.length - 1).concat(blocks, [""]);
}

export function bodyLinesWith(layout: NoteLayout, sheet: PrintedSheet): string[] {
  const replaced = replacedSections(layout, sheet);
  const kept = replaced.lines.concat(layout.lines.slice(replaced.cursor));
  return withBlocksBeforeTheFinalBreak(kept, missingBlocks(layout, sheet));
}

