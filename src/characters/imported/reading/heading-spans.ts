import { sectionHeadingsIn } from "../../../imports/layout/blocks/section-headings";
import type { PluginSection } from "../../../imports/layout/plugin-section";

export interface HeadingSpan {
  readonly section: PluginSection | null;
  readonly heading: number;
  readonly end: number;
}

export function headingSpansOf(lines: readonly string[], bodyStart: number): HeadingSpan[] {
  const spans: HeadingSpan[] = [];
  let open: { section: PluginSection | null; heading: number } | null = null;
  for (const heading of sectionHeadingsIn(lines, bodyStart).found) {
    if (open !== null) spans.push({ section: open.section, heading: open.heading, end: heading.index });
    open = { section: heading.section, heading: heading.index };
  }
  if (open !== null) spans.push({ section: open.section, heading: open.heading, end: lines.length });
  return spans;
}
