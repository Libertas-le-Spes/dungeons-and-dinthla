import { isBigHeading } from "./big-heading";
import type { PluginSection } from "../../imports/layout/plugin-section";

export interface SectionLine {
  readonly text: string;
  readonly line: number;
}

export function sectionLinesOf(lines: readonly string[], bodyStart: number, section: PluginSection): SectionLine[] {
  const found: SectionLine[] = [];
  let open = false;
  for (const [index, line] of lines.entries()) {
    if (index < bodyStart) continue;
    if (isBigHeading(line)) {
      open = line.trimEnd() === section.heading;
      continue;
    }
    if (open) found.push({ text: line, line: index });
  }
  return found;
}
