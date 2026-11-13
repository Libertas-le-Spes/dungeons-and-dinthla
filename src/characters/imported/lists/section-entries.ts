import type { PluginSection } from "../../../imports/layout/plugin-section";
import { LEFT_OUT_START, LINE_START } from "../../../imports/layout/section-line-format";
import { headingSpansOf } from "../reading/heading-spans";
import { sectionLinesOf } from "../reading/section-lines";
import { leftOutCountsOf, type LeftOutCounts } from "./left-out-counts";

export interface SectionEntries {
  readonly present: boolean;
  readonly entries: readonly string[];
  readonly leftOut: LeftOutCounts | null;
}

export const NOTHING_LISTED: SectionEntries = { present: false, entries: [], leftOut: null };

function hasHeading(lines: readonly string[], bodyStart: number, section: PluginSection): boolean {
  for (const span of headingSpansOf(lines, bodyStart)) {
    if (span.section === section) return true;
  }
  return false;
}

export function sectionEntriesOf(lines: readonly string[], bodyStart: number, section: PluginSection): SectionEntries {
  if (!hasHeading(lines, bodyStart, section)) return NOTHING_LISTED;
  const entries: string[] = [];
  let leftOut: LeftOutCounts | null = null;
  for (const line of sectionLinesOf(lines, bodyStart, section)) {
    const text = line.text.trimEnd();
    if (text.startsWith(LEFT_OUT_START)) leftOut = leftOutCountsOf(text.substring(LEFT_OUT_START.length));
    else if (text.startsWith(LINE_START)) entries.push(text.substring(LINE_START.length));
  }
  return { present: true, entries, leftOut };
}
