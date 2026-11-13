import type { PluginSection } from "../../../imports/layout/plugin-section";
import { headingSpansOf, type HeadingSpan } from "./heading-spans";

export interface SectionLine {
  readonly text: string;
  readonly line: number;
}

function isUnderHeading(spans: readonly HeadingSpan[], section: PluginSection, index: number): boolean {
  for (const span of spans) {
    if (span.section === section && index > span.heading && index < span.end) return true;
  }
  return false;
}

export function sectionLinesOf(lines: readonly string[], bodyStart: number, section: PluginSection): SectionLine[] {
  const spans = headingSpansOf(lines, bodyStart);
  const found: SectionLine[] = [];
  for (const [index, text] of lines.entries()) {
    if (isUnderHeading(spans, section, index)) found.push({ text, line: index });
  }
  return found;
}
