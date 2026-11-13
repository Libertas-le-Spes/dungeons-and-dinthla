import { PLUGIN_SECTIONS } from "../../layout/plugin-sections";
import type { PluginSection } from "../../layout/plugin-section";
import { BlockTracker } from "./blocks/block-tracker";
import { plainLineOf } from "./line-ending";
import { bodyLineTooLong, unclosedBlock } from "./note-refusals";
import { MOST_BODY_LINE } from "./note-limits";

const BIG_HEADING = /^ {0,3}#{1,2}(?:[ \t]|$)/;

export interface Boundary {
  readonly index: number;
  readonly section: PluginSection | null;
}

function sectionWithHeading(line: string): PluginSection | null {
  const written = line.trimEnd();
  for (const section of PLUGIN_SECTIONS) {
    if (section.heading === written) return section;
  }
  return null;
}

export function boundariesIn(lines: readonly string[], from: number): Boundary[] {
  const blocks = new BlockTracker();
  const found: Boundary[] = [];
  for (const [index, written] of lines.entries()) {
    if (index < from) continue;
    const line = plainLineOf(written);
    if (line.length > MOST_BODY_LINE) throw bodyLineTooLong();
    if (!blocks.allowsHeading(line)) continue;
    if (!BIG_HEADING.test(line)) continue;
    found.push({ index, section: sectionWithHeading(line) });
  }
  if (!blocks.isClosed()) throw unclosedBlock();
  return found;
}
