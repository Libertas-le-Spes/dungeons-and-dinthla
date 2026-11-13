import type { PluginSection } from "../plugin-section";
import { PLUGIN_SECTIONS } from "../plugin-sections";
import { BlockTracker } from "./block-tracker";

const BIG_HEADING = /^ {0,3}#{1,2}(?:[ \t]|$)/;

export interface SectionHeading {
  readonly index: number;
  readonly section: PluginSection | null;
}

export interface SectionHeadings {
  readonly found: readonly SectionHeading[];
  readonly closed: boolean;
}

function sectionWithHeading(line: string): PluginSection | null {
  const written = line.trimEnd();
  for (const section of PLUGIN_SECTIONS) {
    if (section.heading === written) return section;
  }
  return null;
}

export function sectionHeadingsIn(lines: readonly string[], from: number): SectionHeadings {
  const blocks = new BlockTracker();
  const found: SectionHeading[] = [];
  for (const [index, line] of lines.entries()) {
    if (index < from) continue;
    if (!blocks.allowsHeading(line)) continue;
    if (!BIG_HEADING.test(line)) continue;
    found.push({ index, section: sectionWithHeading(line) });
  }
  return { found, closed: blocks.isClosed() };
}
