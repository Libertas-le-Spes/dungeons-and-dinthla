import { PLUGIN_SECTIONS } from "../../layout/plugin-sections";
import type { PluginSection } from "../../layout/plugin-section";
import { FenceTracker } from "./fence-tracker";
import { plainLineOf } from "./line-ending";

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
  const fence = new FenceTracker();
  const found: Boundary[] = [];
  for (let index = from; index < lines.length; index += 1) {
    const line = plainLineOf(lines[index]!);
    if (!fence.allowsHeading(line)) continue;
    if (!BIG_HEADING.test(line)) continue;
    found.push({ index, section: sectionWithHeading(line) });
  }
  return found;
}
