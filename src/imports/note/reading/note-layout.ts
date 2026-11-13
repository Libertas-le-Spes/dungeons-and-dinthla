import { firstLineAfterProperties } from "../../../campaign/paths/session-file";
import type { PluginSection } from "../../layout/plugin-section";
import { boundariesIn, type Boundary } from "./section-boundaries";
import type { SectionSpan } from "./section-span";
import { LineEnding } from "./line-ending";
import { twoSections } from "./two-sections";

const LINE_BREAK = "\n";

function endOf(boundaries: readonly Boundary[], position: number, lineCount: number): number {
  const next = boundaries[position + 1];
  if (next === undefined) return lineCount;
  return next.index;
}

function spanFor(spans: readonly SectionSpan[], section: PluginSection): SectionSpan | null {
  for (const span of spans) {
    if (span.section === section) return span;
  }
  return null;
}

function spansOf(lines: readonly string[], bodyStart: number): SectionSpan[] {
  const boundaries = boundariesIn(lines, bodyStart);
  const spans: SectionSpan[] = [];
  for (const [position, boundary] of boundaries.entries()) {
    if (boundary.section === null) continue;
    if (spanFor(spans, boundary.section) !== null) throw twoSections(boundary.section);
    spans.push({ section: boundary.section, start: boundary.index, end: endOf(boundaries, position, lines.length) });
  }
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
    const bodyStart = firstLineAfterProperties(text);
    return new NoteLayout(lines, bodyStart, spansOf(lines, bodyStart), LineEnding.of(text));
  }

  propertyLines(): readonly string[] {
    return this.lines.slice(0, this.bodyStart);
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
