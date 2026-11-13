import { isBigHeading } from "./big-heading";
import { PLUGIN_SECTIONS } from "../../imports/layout/plugin-sections";

function isPluginHeading(line: string): boolean {
  const written = line.trimEnd();
  for (const section of PLUGIN_SECTIONS) {
    if (section.heading === written) return true;
  }
  return false;
}

export function pluginSectionLinesOf(lines: readonly string[], bodyStart: number): Set<number> {
  const inside = new Set<number>();
  let open = false;
  for (const [index, line] of lines.entries()) {
    if (index < bodyStart) continue;
    if (isBigHeading(line)) open = isPluginHeading(line);
    if (open) inside.add(index);
  }
  return inside;
}
