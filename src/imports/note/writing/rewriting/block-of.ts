import type { PluginSection } from "../../../layout/plugin-section";
import type { LineEnding } from "../../reading/line-ending";

export function blockOf(section: PluginSection, lines: readonly string[], ending: LineEnding): string[] {
  if (lines.length === 0) return [];
  const block = [ending.ends(section.heading)];
  for (const line of lines) block.push(ending.ends(line));
  return block;
}
