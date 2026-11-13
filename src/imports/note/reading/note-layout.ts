import { firstLineAfterProperties } from "../../../campaign/paths/session-file";
import type { PluginSection } from "../../layout/plugin-section";
import { boundariesIn } from "./section-boundaries";
import type { SectionSpan } from "./section-span";
import { LineEnding, plainLineOf } from "./line-ending";
import { MOST_NOTE_LINES } from "./note-limits";
import { tooManyLines, twoSections } from "./note-refusals";
import { PropertyBlock } from "./property-block";

const LINE_BREAK = "\n";

function afterLastContent(lines: readonly string[], start: number, end: number): number {
  let last = start;
  for (const [position, line] of lines.entries()) {
    if (position < end && plainLineOf(line).trim() !== "") last = position;
  }
  return last + 1;
}

function spanFor(spans: readonly SectionSpan[], section: PluginSection): SectionSpan | null {
  for (const span of spans) {
    if (span.section === section) return span;
  }
  return null;
}

function closedSpan(lines: readonly string[], section: PluginSection, start: number, end: number): SectionSpan {
  return { section, start, end: afterLastContent(lines, start, end) };
}

function spansOf(lines: readonly string[], bodyStart: number): SectionSpan[] {
  const spans: SectionSpan[] = [];
  let open: { section: PluginSection; start: number } | null = null;
  for (const boundary of boundariesIn(lines, bodyStart)) {
    if (open !== null) spans.push(closedSpan(lines, open.section, open.start, boundary.index));
    open = null;
    if (boundary.section === null) continue;
    if (spanFor(spans, boundary.section) !== null) throw twoSections(boundary.section);
    open = { section: boundary.section, start: boundary.index };
  }
  if (open !== null) spans.push(closedSpan(lines, open.section, open.start, lines.length));
  return spans;
}

export class NoteLayout {
  private constructor(
    readonly lines: readonly string[],
    readonly bodyStart: number,
    readonly spans: readonly SectionSpan[],
    readonly ending: LineEnding,
  ) {}

  static of(text: string): NoteLayout {
    const lines = text.split(LINE_BREAK);
    if (lines.length > MOST_NOTE_LINES) throw tooManyLines();
    const bodyStart = firstLineAfterProperties(text);
    return new NoteLayout(lines, bodyStart, spansOf(lines, bodyStart), LineEnding.of(text));
  }

  propertyLines(): readonly string[] {
    return this.lines.slice(0, this.bodyStart);
  }

  properties(): PropertyBlock | null {
    return PropertyBlock.of(this.propertyLines());
  }

  bodyLines(): readonly string[] {
    return this.lines.slice(this.bodyStart);
  }

  spanOf(section: PluginSection): SectionSpan | null {
    return spanFor(this.spans, section);
  }

  sectionLines(section: PluginSection): readonly string[] {
    const span = this.spanOf(section);
    if (span === null) return [];
    return this.lines.slice(span.start + 1, span.end);
  }
}
