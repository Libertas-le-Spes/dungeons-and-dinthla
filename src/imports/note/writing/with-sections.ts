import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { PluginSection } from "../../layout/plugin-section";
import type { NoteLayout } from "../reading/note-layout";
import { SECTION_CONTENTS } from "../sections/section-contents";
import type { SectionContent } from "../sections/section-content";
import { blockOf } from "./block-of";

const TERMINAL = "";

function contentFor(section: PluginSection): SectionContent {
  for (const content of SECTION_CONTENTS) {
    if (content.section === section) return content;
  }
  throw new Error(`No content is written for ${section.heading}.`);
}

class Output {
  readonly lines: string[] = [];
  private endsInBlock = false;

  keep(lines: readonly string[]): void {
    if (lines.length === 0) return;
    this.lines.push(...lines);
    this.endsInBlock = false;
  }

  block(lines: readonly string[]): void {
    if (lines.length === 0) return;
    this.lines.push(...lines);
    this.endsInBlock = true;
  }

  finish(): string[] {
    if (this.endsInBlock) this.lines.push(TERMINAL);
    return this.lines;
  }
}

function replacedSections(layout: NoteLayout, sheet: PrintedSheet, output: Output): number {
  let cursor = layout.bodyStart;
  for (const span of layout.spans) {
    output.keep(layout.lines.slice(cursor, span.start));
    const block = blockOf(span.section, contentFor(span.section).linesOf(sheet), layout.ending);
    output.block(block);
    cursor = span.end;
  }
  return cursor;
}

export function bodyLinesWith(layout: NoteLayout, sheet: PrintedSheet): string[] {
  const output = new Output();
  const cursor = replacedSections(layout, sheet, output);
  output.keep(layout.lines.slice(cursor));
  for (const content of SECTION_CONTENTS) {
    if (layout.spanOf(content.section) !== null) continue;
    output.block(blockOf(content.section, content.linesOf(sheet), layout.ending));
  }
  return output.finish();
}
